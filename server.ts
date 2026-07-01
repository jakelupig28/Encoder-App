import express from "express";
import path from "path";
import multer from "multer";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { createServer as createViteServer } from "vite";
import { ExtractionResult } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for memory storage (file size limit: 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Accuracy Encoding Server is running." });
});

// Primary extraction endpoint
app.post("/api/extract", upload.single("file"), async (req, res): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file was uploaded." });
      return;
    }

    // Determine general file category and extension
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    let fileCategory: "image" | "pdf" | "excel" | "docx" | "unknown" = "unknown";

    if (mimeType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension)) {
      fileCategory = "image";
    } else if (mimeType === "application/pdf" || extension === ".pdf") {
      fileCategory = "pdf";
    } else if (
      [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ].includes(mimeType) ||
      [".xlsx", ".xls", ".csv"].includes(extension)
    ) {
      fileCategory = "excel";
    } else if (
      [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ].includes(mimeType) ||
      [".docx", ".doc"].includes(extension)
    ) {
      fileCategory = "docx";
    }

    // Verify Gemini API configuration before processing
    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || "Gemini API key is not configured.",
      });
      return;
    }

    let extractedText = "";

    // Process based on category
    if (fileCategory === "image") {
      // 1. Image OCR using Gemini
      const base64Data = file.buffer.toString("base64");
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          {
            text: `You are an expert OCR and document digitization system. Extract ALL text from this image with absolute 100% precision.
Guidelines:
1. Preserve structural formatting such as paragraphs, headers, and list items.
2. If there are tables, format them using clean text-aligned rows or Markdown tables.
3. Fix scan artifacts/glitches only if they represent spelling typos, but DO NOT modify any numbers, facts, values, or original intent.
4. Do not include any introduction, conversational preamble, or postscript. Output ONLY the extracted text.`,
          },
        ],
      });

      extractedText = response.text || "";
    } else if (fileCategory === "pdf") {
      // 2. Multi-page PDF OCR/Text Extraction using Gemini (native support)
      const base64Data = file.buffer.toString("base64");
      const pdfPart = {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          pdfPart,
          {
            text: `You are an expert PDF text extraction system. Extract and format all text from this multi-page PDF document with absolute precision.
Guidelines:
1. Preserve the layout structure, headings, lists, page numbers, and tables.
2. For multiple pages, separate sections logically with horizontal dividers (e.g. ---) indicating page breaks where helpful.
3. If tabular data exists, render it cleanly as Markdown tables.
4. Output ONLY the extracted text without any preamble, conversation, or greeting.`,
          },
        ],
      });

      extractedText = response.text || "";
    } else if (fileCategory === "docx") {
      // 3. Word Document Parsing (mammoth for clean local extraction + Gemini for perfect typography/layout cleanup)
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        const rawWordText = result.value || "";

        if (rawWordText.trim() === "") {
          throw new Error("No readable text found in Word document.");
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Below is a raw text stream extracted from a Word Document (.docx). Restore and format this text into an extremely clean, readable document with beautiful Markdown.
Guidelines:
1. Reconstruct appropriate paragraph breaks, visual headings (H1, H2, H3), and bulleted/numbered lists based on context.
2. Fix any obvious run-together words, symbol errors, or conversion typos.
3. Do not change any numbers, names, dates, or core meanings.
4. Return ONLY the polished text without any introduction or explanatory notes.

RAW TEXT:
${rawWordText}`,
        });

        extractedText = response.text || rawWordText;
      } catch (err: any) {
        console.error("Word Doc parsing error, falling back to Gemini file analysis: ", err);
        // Fallback: Send docx directly to Gemini (might be supported or fail, but better to try with general analysis if mammoth fails)
        res.status(500).json({
          success: false,
          error: `Failed to parse Word Document: ${err.message || "Unknown parsing error"}`,
        });
        return;
      }
    } else if (fileCategory === "excel") {
      // 4. Excel spreadsheet parsing (xlsx for local processing + Gemini for formatting/alignment)
      try {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        let excelRawData = "";

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          if (csvData.trim()) {
            excelRawData += `### Sheet: ${sheetName}\n${csvData}\n\n`;
          }
        });

        if (excelRawData.trim() === "") {
          throw new Error("No readable data found in Excel spreadsheet.");
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Below is the raw CSV data extracted from an Excel spreadsheet. Convert this into clean, beautiful, aligned text tables or Markdown tables for outstanding legibility.
Guidelines:
1. Format sheets into separate, distinct tables with clear headers.
2. Ensure columns are aligned perfectly.
3. Keep cell contents intact; do not rewrite formulas, values, dates, or calculations.
4. Return ONLY the structured tables and sheets layout. No introductory or explanatory conversational text.

RAW DATA:
${excelRawData}`,
        });

        extractedText = response.text || excelRawData;
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: `Failed to parse Excel file: ${err.message || "Unknown error"}`,
        });
        return;
      }
    } else {
      // 5. Unknown/text files fallback
      const rawTextFallback = file.buffer.toString("utf-8");
      if (rawTextFallback.trim()) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Below is raw content from a file named "${file.originalname}". Format and clean up this text for excellent, professional readability.
Guidelines:
1. Structure into paragraphs and logical blocks.
2. Return ONLY the cleaned content with zero preamble.

RAW CONTENT:
${rawTextFallback}`,
        });
        extractedText = response.text || rawTextFallback;
      } else {
        res.status(400).json({
          success: false,
          error: "Unsupported file type or empty file content.",
        });
        return;
      }
    }

    // Post-processing and cleaning up formatting marks (e.g., unnecessary asterisks)
    let cleanedText = extractedText;
    // Replace markdown bold tags (**text**) with plain text
    cleanedText = cleanedText.replace(/\*\*/g, "");
    // Replace list asterisks at the start of a line with standard bullet hyphens
    cleanedText = cleanedText.replace(/^\s*\*\s+/gm, "- ");
    // Remove any remaining individual asterisks
    cleanedText = cleanedText.replace(/\*(?!\s|\d)/g, "").replace(/(?<!\s|\d)\*/g, "");

    const trimmedText = cleanedText.trim();
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const charCount = trimmedText.length;

    const result: ExtractionResult = {
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: fileCategory,
      text: cleanedText,
      timestamp: Date.now(),
      wordCount,
      charCount,
      tags: [fileCategory, extension.replace(".", "")].filter(Boolean),
    };

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Extraction error: ", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during file extraction.",
    });
  }
});

// Configure Vite or Static Asset serving
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Accuracy Encoding Server listening on http://0.0.0.0:${PORT}`);
  });
};

setupServer();
