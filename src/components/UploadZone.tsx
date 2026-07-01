import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export default function UploadZone({ onFileSelect, isProcessing, error }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateAndSelectFile = (file: File) => {
    onFileSelect(file);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id="file-upload-input"
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.doc,.xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      <div
        id="drop-zone-container"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : triggerFileInput}
        className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900/50"
        } ${isProcessing ? "pointer-events-none opacity-80" : ""}`}
      >
        {/* Visual Scan lines in processing mode */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              exit={{ opacity: 0 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2.2,
                ease: "easeInOut",
              }}
              className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80 shadow-[0_0_12px_rgba(99,102,241,0.8)] z-10"
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center max-w-lg">
          {/* Icons Grid with active animations */}
          <div className="flex items-center gap-4 mb-5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors duration-300">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl scale-110 shadow-sm border border-indigo-100/10">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          {isProcessing ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                Parsing & Extracting Text...
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Using Gemini AI OCR to process pages, structure tables, and format layouts with precision.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                Drag & drop document or image here
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                or <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">browse your files</span>
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md">JPG, PNG</span>
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md">PDF Documents</span>
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md">Word (DOCX)</span>
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md">Excel (XLSX, CSV)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload/API Errors Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Extraction Failed</span>
              <p className="opacity-90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
