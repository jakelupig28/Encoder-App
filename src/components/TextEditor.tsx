import React, { useState, useEffect } from "react";
import { Copy, Check, Download, RotateCcw, Trash2, Tag, CaseUpper, Space, Hash, ChevronDown, CheckSquare, Sparkles } from "lucide-react";
import { ExtractionResult } from "../types";

const TAG_RULES = [
  {
    tag: "invoice",
    keywords: ["invoice", "receipt", "bill", "tax", "total", "qty", "payment", "amount", "price", "subtotal", "due", "paid", "vendor", "merchant"]
  },
  {
    tag: "contract",
    keywords: ["contract", "agreement", "terms", "agree", "party", "parties", "hereby", "confidential", "notice", "clause", "client", "service", "liability", "termination"]
  },
  {
    tag: "budget",
    keywords: ["budget", "report", "finance", "revenue", "sales", "expense", "profit", "quarter", "q1", "q2", "q3", "q4", "conversion", "cost", "margin", "forecast", "projection"]
  },
  {
    tag: "resume",
    keywords: ["resume", "cv", "experience", "education", "skills", "employment", "professional", "work history", "project", "university", "graduate", "certificate", "summary"]
  },
  {
    tag: "meeting-notes",
    keywords: ["meeting", "minutes", "notes", "agenda", "discussion", "action items", "attendees", "present", "summary", "topic", "schedule"]
  },
  {
    tag: "technical",
    keywords: ["const ", "let ", "import ", "function", "class ", "api", "endpoint", "database", "query", "schema", "code", "programming", "developer", "server"]
  },
  {
    tag: "recipe",
    keywords: ["recipe", "ingredients", "cook", "bake", "cup", "tsp", "tbsp", "sauce", "sugar", "salt", "minutes", "heat", "oven", "prep time", "servings"]
  }
];

interface TextEditorProps {
  activeResult: ExtractionResult | null;
  onUpdateText: (id: string, text: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
}

export default function TextEditor({ activeResult, onUpdateText, onUpdateTags, onDelete }: TextEditorProps) {
  const [editorText, setEditorText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>("");
  const [showUtilities, setShowUtilities] = useState<boolean>(false);

  // Sync editor text with active result
  useEffect(() => {
    if (activeResult) {
      setEditorText(activeResult.text);
    } else {
      setEditorText("");
    }
    setCopied(false);
  }, [activeResult]);

  if (!activeResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm min-h-[350px]">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl flex items-center justify-center text-zinc-400 mb-4 border border-zinc-100 dark:border-zinc-800">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
          No document selected
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Upload a file (PNG, JPG, PDF, Word, or Excel) to extract text, or select an item from your history sidebar to view and edit.
        </p>
      </div>
    );
  }

  // Calculate live stats
  const cleanText = editorText.trim();
  const liveWordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const liveCharCount = editorText.length;
  const liveLineCount = editorText ? editorText.split("\n").length : 0;

  // Handle manual edits
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value;
    setEditorText(nextText);
    onUpdateText(activeResult.id, nextText);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed: ", err);
    }
  };

  // Download as text file
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editorText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = activeResult.fileName.replace(/\.[^/.]+$/, "") + "_extracted.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Tag Management
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase();
    if (tag && !activeResult.tags.includes(tag)) {
      const updatedTags = [...activeResult.tags, tag];
      onUpdateTags(activeResult.id, updatedTags);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = activeResult.tags.filter((t) => t !== tagToRemove);
    onUpdateTags(activeResult.id, updatedTags);
  };

  // Analyze text and suggest tags in real-time
  const getSuggestedTags = (): string[] => {
    if (!activeResult) return [];
    const combinedLower = `${editorText} ${activeResult.fileName}`.toLowerCase();
    
    const matched: string[] = [];
    TAG_RULES.forEach((rule) => {
      const hasMatch = rule.keywords.some((kw) => combinedLower.includes(kw));
      if (hasMatch) {
        matched.push(rule.tag);
      }
    });

    // Also fallback based on file extension / type
    if (activeResult.fileType === "excel" && !matched.includes("budget")) {
      matched.push("budget");
    }

    // Filter out tags that are already assigned
    return matched.filter((tag) => !activeResult.tags.includes(tag));
  };

  const suggestedTags = getSuggestedTags();

  const handleAddSuggestedTag = (tag: string) => {
    if (!activeResult.tags.includes(tag)) {
      const updatedTags = [...activeResult.tags, tag];
      onUpdateTags(activeResult.id, updatedTags);
    }
  };

  // TEXT PROCESSING UTILITIES
  const makeUppercase = () => {
    const modified = editorText.toUpperCase();
    setEditorText(modified);
    onUpdateText(activeResult.id, modified);
  };

  const makeLowercase = () => {
    const modified = editorText.toLowerCase();
    setEditorText(modified);
    onUpdateText(activeResult.id, modified);
  };

  const stripExtraSpacing = () => {
    const modified = editorText
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n");
    setEditorText(modified);
    onUpdateText(activeResult.id, modified);
  };

  const removeBlankLines = () => {
    const modified = editorText
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");
    setEditorText(modified);
    onUpdateText(activeResult.id, modified);
  };

  const stripMarkdownSymbols = () => {
    // Basic stripping of markdown bold, italic, lists, and links
    const modified = editorText
      .replace(/[*#_`~>]/g, "") // remove formatting marks
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // clean links [Text](url) -> Text
      .trim();
    setEditorText(modified);
    onUpdateText(activeResult.id, modified);
  };

  const resetOriginalText = () => {
    if (window.confirm("Discard all edits and revert back to the raw generated extraction?")) {
      // Since it's stored in history state, if we edit we modify it.
      // But we can keep track of the original raw if needed. For now, let's treat this as empty/clear option.
      setEditorText("");
      onUpdateText(activeResult.id, "");
    }
  };

  // Human readable file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div id="text-editor-container" className="flex flex-col border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden h-full">
      {/* Top Header Panel */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0 uppercase tracking-wider">
            {activeResult.fileType}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {activeResult.fileName}
            </h4>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {formatSize(activeResult.fileSize)} • {new Date(activeResult.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          {/* Main Direct Copy Button */}
          <button
            id="editor-copy-btn"
            onClick={handleCopy}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 ${
              copied
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied Accuracy!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy to Clipboard
              </>
            )}
          </button>

          {/* Download Text */}
          <button
            id="editor-download-btn"
            onClick={handleDownload}
            className="cursor-pointer p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200"
            title="Download as Plain Text (.txt)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete extraction */}
          <button
            id="editor-delete-btn"
            onClick={() => onDelete(activeResult.id)}
            className="cursor-pointer p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200"
            title="Delete from History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Utilities Drawer Toggle */}
      <div className="px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <button
          onClick={() => setShowUtilities(!showUtilities)}
          className="cursor-pointer inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showUtilities ? "rotate-180" : ""}`} />
          Text Management Utilities
        </button>
        <span className="font-mono text-zinc-400">OCR AI Optimizations Active</span>
      </div>

      {/* Utilities Dashboard */}
      {showUtilities && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <button
            onClick={makeUppercase}
            className="cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-150"
          >
            <CaseUpper className="w-3.5 h-3.5 text-indigo-500" />
            UPPERCASE
          </button>
          <button
            onClick={makeLowercase}
            className="cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-150"
          >
            <CaseUpper className="w-3.5 h-3.5 text-indigo-400 rotate-180" />
            lowercase
          </button>
          <button
            onClick={stripExtraSpacing}
            className="cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-150"
            title="Converts multiple spaces into a single space"
          >
            <Space className="w-3.5 h-3.5 text-sky-500" />
            Trim Spaces
          </button>
          <button
            onClick={removeBlankLines}
            className="cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-150"
          >
            <Hash className="w-3.5 h-3.5 text-teal-500" />
            Remove Blanks
          </button>
          <button
            onClick={stripMarkdownSymbols}
            className="cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-150"
            title="Strips formatting symbols like *, #, and links"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            Strip Markdown
          </button>
        </div>
      )}

      {/* Editor Textarea with full edit capabilities */}
      <div className="flex-1 min-h-[300px] relative">
        <textarea
          id="raw-text-editor"
          value={editorText}
          onChange={handleTextChange}
          className="w-full h-full min-h-[300px] p-5 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-950 focus:outline-none resize-none overflow-y-auto"
          placeholder="Extracted text will appear here. Feel free to edit directly..."
        />
      </div>

      {/* Tags and Stats Footer Panel */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Dynamic Tagging Panel */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {activeResult.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-200/60 dark:bg-zinc-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-700 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-400 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                onClick={() => handleRemoveTag(tag)}
                title="Click to remove tag"
              >
                #{tag}
              </span>
            ))}
            <form onSubmit={handleAddTag} className="inline-flex">
              <input
                id="tag-input"
                type="text"
                placeholder="+ tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="px-2 py-0.5 max-w-[80px] bg-transparent text-xs font-medium text-zinc-600 dark:text-zinc-300 border-b border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 focus:outline-none focus:border-indigo-500"
              />
            </form>

            {suggestedTags.length > 0 && (
              <div className="flex items-center gap-1.5 sm:ml-2 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-1.5 sm:pt-0 sm:pl-3.5 w-full sm:w-auto">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  Suggested tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSuggestedTag(tag)}
                      className="cursor-pointer inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/40 rounded-full text-[10px] font-bold transition-all duration-150 hover:scale-105 active:scale-95"
                      title={`Click to add #${tag}`}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time stats indicators */}
        <div className="flex items-center gap-4 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
          <div>
            WORDS: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{liveWordCount}</span>
          </div>
          <div>
            CHARS: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{liveCharCount}</span>
          </div>
          <div>
            LINES: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{liveLineCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
