/**
 * Shared Type Definitions for the Accuracy Encoding / Text Extraction System
 */

export interface ExtractionResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: "image" | "pdf" | "excel" | "docx" | "unknown";
  text: string;
  timestamp: number;
  wordCount: number;
  charCount: number;
  tags: string[];
}

export interface ApiResponse {
  success: boolean;
  data?: ExtractionResult;
  error?: string;
}
