import { useState } from "react";
import { Search, Image as ImageIcon, FileSpreadsheet, FileText, File, Trash2, Calendar, HardDrive, Tag } from "lucide-react";
import { ExtractionResult } from "../types";

interface HistorySidebarProps {
  history: ExtractionResult[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
}

export default function HistorySidebar({ history, activeId, onSelect, onDelete, onClearHistory }: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Get list of all unique tags in history for filtering
  const allTags = Array.from(
    new Set(history.flatMap((item) => item.tags || []))
  );

  // Filter history list
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTagFilter
      ? item.tags?.includes(selectedTagFilter)
      : true;

    return matchesSearch && matchesTag;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500" />;
      case "docx":
        return <FileText className="w-4 h-4 text-indigo-500" />;
      default:
        return <File className="w-4 h-4 text-zinc-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div id="history-sidebar-container" className="flex flex-col border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 tracking-wide flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-500" />
            EXTRACTION HISTORY
          </h3>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to completely clear your extraction history? This is irreversible.")) {
                  onClearHistory();
                }
              }}
              className="cursor-pointer text-xs font-semibold text-red-600 dark:text-red-400 hover:underline hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Input box */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search filenames or extracted text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>

        {/* Filter tags panel */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedTagFilter(null)}
              className={`cursor-pointer px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                selectedTagFilter === null
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)}
                className={`cursor-pointer px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition-all duration-150 ${
                  tag === selectedTagFilter
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Tag className="w-2.5 h-2.5 opacity-60" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History Items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[400px] sm:max-h-none">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 dark:text-zinc-600 flex flex-col items-center justify-center h-full">
            <Calendar className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No historical logs found.</p>
            {history.length > 0 && <p className="text-xs mt-1">Try resetting search filters.</p>}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group flex items-start gap-3 p-4 text-left cursor-pointer transition-all duration-200 ${
                activeId === item.id
                  ? "bg-indigo-50/70 dark:bg-indigo-950/20 border-l-4 border-indigo-500"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-l-4 border-transparent"
              }`}
            >
              {/* File Icon Block */}
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                {getFileIcon(item.fileType)}
              </div>

              {/* Text Block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.fileName}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="cursor-pointer text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate mt-0.5">
                  {formatSize(item.fileSize)} • {item.wordCount} words
                </p>

                {/* Sub preview of content */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                  {item.text.replace(/[*#_`~>]/g, "")}
                </p>

                {/* Tags preview */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 self-center">
                        +{item.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer Metrics */}
      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-between">
        <span>TOTAL SAVED:</span>
        <span className="font-bold text-zinc-800 dark:text-zinc-200">{history.length} extractions</span>
      </div>
    </div>
  );
}
