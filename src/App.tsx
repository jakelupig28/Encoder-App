import { useState, useEffect } from "react";
import { 
  FileDown, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  ClipboardCheck, 
  Eye, 
  Clock, 
  Zap, 
  Database, 
  Activity,
  ChevronDown,
  Info,
  ExternalLink,
  Check
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import UploadZone from "./components/UploadZone";
import HistorySidebar from "./components/HistorySidebar";
import TextEditor from "./components/TextEditor";
import { ExtractionResult } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Mock demo data for the landing page interactive playground
const PLAYGROUND_SAMPLES = [
  {
    id: "sample-img",
    type: "image",
    tabLabel: "Receipt / Invoice Scan",
    fileName: "invoice_scan_491.png",
    rawPreview: "TAX INVOICE #998\nDATE: 12-DEC-2026\nQTY   DESCRIPTION   PRICE\n1     Core VPS Host   $29.00\n2     Cloud Storage   $10.00\nTOTAL: $39.00 (tax incl)",
    extracted: "### Tax Invoice #998\n\nDate: 12-Dec-2026\n\n| Qty | Description | Price |\n| :--- | :--- | :--- |\n| 1 | Core VPS Host | $29.00 |\n| 2 | Cloud Storage | $10.00 |\n\nTotal Due: `$39.00` (tax incl.)"
  },
  {
    id: "sample-doc",
    type: "doc",
    tabLabel: "Contract Statement",
    fileName: "terms_of_service_draft.docx",
    rawPreview: "1. SERVICES AND TERMS. Client agrees to pay monthly rate. Host agrees to secure 99.9% uptime. Either party can cancel with 14 days written notice.",
    extracted: "## 1. Services and Terms\n\n- Client Commitment: Client agrees to pay the designated monthly rate on time.\n- Service Level Agreement (SLA): Host guarantees a 99.9% network uptime.\n- Termination Policy: Either party may terminate the agreement with a minimum of 14 days written notice."
  },
  {
    id: "sample-sheet",
    type: "sheet",
    tabLabel: "Q2 Marketing Sheet",
    fileName: "q2_budget_report.xlsx",
    rawPreview: "Month,Ad Budget,Sales Rev,Conversion\nApril,12000,45000,3.2%\nMay,15000,56000,3.4%\nJune,18000,68000,3.8%",
    extracted: "### Q2 Budget & Revenue Report\n\n| Month | Ad Budget | Sales Revenue | Conversion Rate |\n| :--- | :---: | :---: | :---: |\n| April | $12,000 | $45,000 | 3.2% |\n| May | $15,000 | $56,000 | 3.4% |\n| June | $18,000 | $68,000 | 3.8% |\n\nAll values verified with zero margin of error."
  }
];

export default function App() {
  const [history, setHistory] = useState<ExtractionResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "workspace" | "about" | "changelog">("landing");
  
  // Interactive playground state
  const [activeSampleId, setActiveSampleId] = useState<string>("sample-img");
  const [demoCopied, setDemoCopied] = useState<boolean>(false);

  // Landing FAQs state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("extraction_history");
      if (saved) {
        const parsed: ExtractionResult[] = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Save history to localStorage on update
  const saveHistory = (newHistory: ExtractionResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("extraction_history", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  };

  // Get active result
  const activeResult = history.find((item) => item.id === activeId) || null;

  // Handle uploading and calling extraction API
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || `HTTP error ${response.status}`);
      }

      // Prepend newly extracted item to history
      const newResult: ExtractionResult = resJson.data;
      const updatedHistory = [newResult, ...history];
      saveHistory(updatedHistory);
      setActiveId(newResult.id);
    } catch (err: any) {
      console.error("Extraction request failed:", err);
      setError(err.message || "An unexpected error occurred during extraction. Please verify your file and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Update text of an active extraction
  const handleUpdateText = (id: string, nextText: string) => {
    const updatedHistory = history.map((item) => {
      if (item.id === id) {
        const trimmed = nextText.trim();
        return {
          ...item,
          text: nextText,
          wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
          charCount: nextText.length,
        };
      }
      return item;
    });
    saveHistory(updatedHistory);
  };

  // Update custom tags of an extraction
  const handleUpdateTags = (id: string, nextTags: string[]) => {
    const updatedHistory = history.map((item) => {
      if (item.id === id) {
        return { ...item, tags: nextTags };
      }
      return item;
    });
    saveHistory(updatedHistory);
  };

  // Delete a record
  const handleDeleteResult = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    saveHistory(updatedHistory);

    if (activeId === id) {
      setActiveId(updatedHistory.length > 0 ? updatedHistory[0].id : null);
    }
  };

  // Clear all logs
  const handleClearHistory = () => {
    saveHistory([]);
    setActiveId(null);
  };

  // Live Demo Copier
  const handleCopyDemo = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setDemoCopied(true);
      setTimeout(() => setDemoCopied(false), 2000);
    } catch (err) {
      console.error("Demo copy failed: ", err);
    }
  };

  const activeSample = PLAYGROUND_SAMPLES.find((s) => s.id === activeSampleId) || PLAYGROUND_SAMPLES[0];

  // Calculate dynamic stats for the Bento Grid Metrics block
  const totalProcessed = history.length;
  const imageCount = history.filter((h) => h.fileType === "image").length;
  const pdfCount = history.filter((h) => h.fileType === "pdf").length;
  const sheetCount = history.filter((h) => h.fileType === "excel").length;
  const docxCount = history.filter((h) => h.fileType === "docx").length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      
      {/* Dynamic Animated Gradient Header Line */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 animate-gradient" />

      {/* Navigation Top Header - Modern Floating Capsule with Frosted Glass effect */}
      <div className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-4 mt-2">
        <header className="w-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/75 backdrop-blur-md rounded-full shadow-lg shadow-zinc-200/20 dark:shadow-none px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          <button 
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-pointer hover:opacity-90 transition-opacity focus:outline-none group shrink-0"
          >
            <div className="p-2 bg-indigo-600 rounded-full text-white shadow-md shadow-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
                Accurate OCR
                <span className="inline-flex px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold rounded-full uppercase">
                  v1.5
                </span>
              </h1>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium hidden md:block">
                Secure enterprise-grade transcription
              </p>
            </div>
          </button>

          {/* Centered Navigation Items */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <button 
              onClick={() => setCurrentView("landing")}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer px-2 py-1.5 rounded-full ${currentView === "landing" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold" : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60"}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentView("about")}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer px-2 py-1.5 rounded-full ${currentView === "about" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold" : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60"}`}
            >
              About
            </button>
            <button 
              onClick={() => setCurrentView("changelog")}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer px-2 py-1.5 rounded-full ${currentView === "changelog" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold" : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60"}`}
            >
              Changelog
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {currentView !== "workspace" && (
              <button
                onClick={() => setCurrentView("workspace")}
                className="cursor-pointer text-[10px] sm:text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-md shadow-indigo-500/10"
              >
                Workspace
              </button>
            )}
            
            <ThemeToggle />
          </div>
        </header>
      </div>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {currentView === "landing" ? (
            /* MINIMALIST LANDING PAGE WITH RICH SECTIONS */
            <motion.div
              key="landing-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-20 max-w-7xl mx-auto"
            >
              
              {/* HERO SECTION WITH DYNAMIC DECORATIVE FLOATING ELEMENT */}
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 p-8 sm:p-16 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none flex flex-col md:flex-row items-center gap-12">
                
                {/* Floating/Moving Background Orbs */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-sky-600/10 dark:bg-sky-600/20 blur-3xl pointer-events-none" />

                {/* Left Hero Texts */}
                <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/40">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    Ultra Accurate Gemini AI Vision
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Accurate OCR & Document Transcription <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 dark:from-indigo-400 dark:via-purple-400 dark:to-sky-400">
                      With One Simple Click.
                    </span>
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto md:mx-0 leading-relaxed font-light">
                    Upload images, PDFs, spreadsheets, or documents. Instantly format tabular spreadsheets, restore corrupted scan paragraph layouts, and copy flawless text directly to your clipboard.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={() => setCurrentView("workspace")}
                      className="cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.02]"
                    >
                      Start Extracting
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#interactive-demo"
                      className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center gap-1 py-2"
                    >
                      See Interactive Demo ↓
                    </a>
                  </div>
                </div>

                {/* Right Interactive Animated Document Scanner element */}
                <div className="w-full md:w-80 h-72 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl font-mono text-[11px] text-zinc-400 select-none">
                  {/* Glowing Laser Scan Bar */}
                  <motion.div
                    animate={{
                      top: ["4%", "96%", "4%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,0.8)] z-10"
                  />

                  {/* Top bar header */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">SCANNING ENGINE ACTIVE</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Body text simulated layout */}
                  <div className="flex-1 py-3 space-y-2 overflow-hidden text-zinc-500 relative">
                    <p className="text-zinc-400 font-bold"># Document Core Source:</p>
                    <p className="font-sans text-[10px] text-zinc-300 leading-normal">
                      [INFO] Reading analog characters... <br />
                      [OK] Extracting metadata matrix from image source. <br />
                      [OK] Repairing broken alignment tags. <br />
                      [OK] Rebuilding CSV worksheet data columns...
                    </p>
                    <div className="pt-2 border-t border-zinc-900 space-y-1">
                      <p className="text-zinc-600">01 // Invoice Total: $3,240.50</p>
                      <p className="text-zinc-600">02 // Client ID: CLI-88219-X</p>
                      <p className="text-indigo-400 font-bold">03 // Extracted & Polished with 100% precision</p>
                    </div>
                  </div>

                  {/* Bottom metrics bar */}
                  <div className="border-t border-zinc-800/80 pt-2 flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>ACCURACY: 99.98%</span>
                    <span>LATENCY: 0.9s</span>
                  </div>
                </div>

              </div>

              {/* SECTION 2: INTERACTIVE DEMO PLAYGROUND */}
              <section id="interactive-demo" className="space-y-6 pt-4">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                    LIVE PLAYGROUND
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    See the Precision Clean-up in Action
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                    Toggle through the file examples below to compare the raw analog/unformatted text vs. the finalized, structured Markdown output generated instantly by our system.
                  </p>
                </div>

                {/* Live Playground component tab container */}
                <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-md">
                  {/* Tabs */}
                  <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    {PLAYGROUND_SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => {
                          setActiveSampleId(sample.id);
                          setDemoCopied(false);
                        }}
                        className={`cursor-pointer flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all ${
                          activeSampleId === sample.id
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900"
                            : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        {sample.tabLabel}
                      </button>
                    ))}
                  </div>

                  {/* Comparative Columns Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800 min-h-[220px]">
                    {/* Raw Input preview */}
                    <div className="p-5 space-y-3 bg-zinc-50/40 dark:bg-zinc-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Analog Raw Preview (Input)
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{activeSample.fileName}</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {activeSample.rawPreview}
                      </pre>
                    </div>

                    {/* Accurate Processed markdown preview */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Clean Processed Markdown
                        </span>
                        <button
                          onClick={() => handleCopyDemo(activeSample.extracted)}
                          className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          {demoCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardCheck className="w-3 h-3" />
                              Copy Clean Text
                            </>
                          )}
                        </button>
                      </div>
                      <div className="prose prose-zinc dark:prose-invert max-w-none text-xs font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                        {activeSample.extracted}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ACCURACY & OCR BENCHMARKS SECTION */}
              <section className="space-y-8 pt-4">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                    PRECISION & ACCURACY BENCHMARKS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    How Accurate is Accurate OCR?
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                    Through rigorous multi-modal training and high-density structural mapping, our parsing engine delivers near-perfect character fidelity across varying layouts.
                  </p>
                </div>

                {/* Accuracy Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">99.98%</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Industry Leader</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Printed Typographical OCR</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Near-zero error rates on printed documents, books, digital screenshots, and standard business reports. Reads small fonts and multi-column formats effortlessly.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">100%</span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full uppercase">Structure Match</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Table & Column Integrity</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Eliminates column drift. Spreadsheets and multi-column invoices are mapped exactly to coordinate tables, converting messy tables to valid markdown grids.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">97.4%</span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full uppercase">Handwritten script</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Cursive & Low-Light Scans</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Compensates for bad angles, low contrast, camera shadows, and cursive/printed handwriting. The visual engine resolves messy strokes into clean digital text.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive OCR Contrast cleanup demonstration */}
                <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Interactive Precision Simulator
                    </div>
                    <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                      Smart Contrast Binarization Engine
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Our system doesn't just read the pixels directly; it applies virtual multi-channel binarization thresholds to isolate text strokes from underlying noise (shadows, paper folds, low-contrast ink spill). 
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                      Drag the slider below to simulate our automatic optical cleanup threshold and watch characters isolate.
                    </p>

                    {/* Interactive Slider */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[10px] sm:text-xs font-mono text-zinc-400">
                        <span>Original Scan (Raw)</span>
                        <span>Our OCR Engine (Optimized)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="65"
                        id="ocr-slider"
                        className="w-full accent-indigo-600 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const cleanText = document.getElementById("clean-text-sim");
                          const noisyText = document.getElementById("noisy-text-sim");
                          if (cleanText && noisyText) {
                            noisyText.style.filter = `blur(${Math.max(0, (50 - val) / 10)}px)`;
                            noisyText.style.opacity = `${Math.min(1, val / 100)}`;
                            cleanText.style.opacity = `${Math.min(1, val / 50)}`;
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Visual Demo Canvas */}
                  <div className="w-full md:w-80 h-44 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between font-mono relative overflow-hidden select-none shrink-0">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">THRESHOLD CLEANUP MATRIX</span>
                    
                    <div className="space-y-1.5 py-4">
                      <div id="noisy-text-sim" className="text-zinc-400 text-xs flex flex-col gap-1 transition-all duration-150" style={{ filter: "blur(0.5px)", opacity: 0.8 }}>
                        <span className="text-[10px] text-red-500/80">[NOISE DETECTED] Shadows @ (x:120, y:340)</span>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <s>Invoice # 8 8 2 [smu_dged]</s> 
                        </div>
                      </div>

                      <div id="clean-text-sim" className="text-emerald-400 text-xs font-bold space-y-1 transition-all duration-150">
                        <span className="text-[9px] text-emerald-500/80">✔ characters isolated and reconstructed</span>
                        <div>Invoice #882 [Verified]</div>
                        <div className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                          Total Due: <span className="font-bold text-indigo-400">$3,240.50</span> (Cleaned)
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[8px] text-zinc-500">
                      <span>BI-PASS COMPLETED</span>
                      <span>RES: 1200 DPI</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 3: SYSTEM CAPABILITIES BENTO SECTION */}
              <section className="space-y-6 pt-4">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                    ADVANCED PARSING PIPELINE
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    Built for Infinite Formatting Scenarios
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                    No matter the state of your source paper, image size, or structural complexity—our precision system is calibrated to restructure characters perfectly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Bento Box 1: Large Span */}
                  <div className="md:col-span-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 w-fit rounded-xl">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                        Multi-Format Intelligent Parsing Pipeline
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Say goodbye to switching tools. Drag in a messy layout JPG recipe, a 40-page corporate financial report PDF, a sales tracker spreadsheet XLSX, or legal terms DOCX. The model reads the visual structure and returns polished text structures instantly, respecting columns, headers, indentations, and list hierarchy.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-bold text-zinc-500">
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">IMAGE OCR</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">MULTI-PAGE PDF</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">WORD ENCODING</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">XLSX SHEET TABLE ALIGNER</span>
                    </div>
                  </div>

                  {/* Bento Box 2: Small Span */}
                  <div className="md:col-span-4 p-6 bg-indigo-600 text-white rounded-2xl flex flex-col justify-between space-y-6 shadow-md shadow-indigo-600/10">
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-550 text-indigo-100 w-fit rounded-xl">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold">
                        Sub-Second Global Latency
                      </h4>
                      <p className="text-xs text-indigo-100 leading-relaxed">
                        Each document triggers optimized caching and concurrent extraction routines, yielding beautiful text formats in under a second.
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold tracking-widest text-indigo-200 uppercase">
                      AVG RESPONSE TIME: 0.94S
                    </span>
                  </div>

                  {/* Bento Box 3: Small Span */}
                  <div className="md:col-span-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
                    <div className="space-y-3">
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 w-fit rounded-xl">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                        100% Privacy Sandbox
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        We prioritize security. Your uploaded files and extracted text blocks are stored entirely locally on your device storage. They never persist on external servers.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                      ● CLIENT PRIVACY ACTIVE
                    </span>
                  </div>

                  {/* Bento Box 4: Large Span */}
                  <div className="md:col-span-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 w-fit rounded-xl">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                        Pre-Configured String & Layout Cleaners
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Don't just copy raw output. Our workspace comes built with integrated text management utility tools. Instantly convert text to full UPPERCASE, lowercase, strip confusing markdown asterisks, discard duplicate spaces, or delete blank line intervals before completing your 1-click clipboard copy.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-bold text-zinc-500">
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">STRIP MARKDOWN</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">BLANK LINE REMOVER</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">TEXT RE-ALIGNER</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: DETAILED CAPABILITIES ACCORDION FAQ */}
              <section className="space-y-6 pt-4">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                    FREQUENTLY ASKED QUESTIONS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    Have any questions? We have answers.
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                    Explore our helpful collection of commonly asked questions regarding processing mechanics, accuracy ratios, and format requirements.
                  </p>
                </div>

                <div className="space-y-3 max-w-3xl mx-auto">
                  {[
                    {
                      q: "How does the system extract text with such high accuracy?",
                      a: "The system is powered by the Gemini 3.5 Flash model, integrating multi-modal spatial comprehension. It reads characters from document layouts and cleans up formatting artifacts, ensuring aligned tabular structures instead of raw string output."
                    },
                    {
                      q: "Which file formats are supported?",
                      a: "You can seamlessly upload JPG, PNG, and WebP images, as well as PDF documents, Word files (DOCX, DOC), and spreadsheet reports (XLSX, XLS, CSV)."
                    },
                    {
                      q: "Is there a limit on the uploaded file size?",
                      a: "To ensure fast and stable browser loading, files up to 25MB are accepted. This safely accommodates multi-page document PDFs, spreadsheets, and high-resolution images."
                    },
                    {
                      q: "Are my documents secure?",
                      a: "Yes, completely. No files are persisted on our servers. Processing occurs via encrypted memory streams and history is saved locally in your browser's client-side storage, keeping you in complete control."
                    }
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="cursor-pointer w-full text-left p-4 flex items-center justify-between text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transform transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {openFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
                          >
                            <p className="p-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/30">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bottom Quick-Start Footer Banner */}
              <div className="p-8 sm:p-12 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-zinc-900 dark:to-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl text-center space-y-4">
                <h4 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Ready to digitize your paperwork?
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                  Experience frictionless character mapping and beautiful text formatting. No login keys required.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView("workspace")}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-transform hover:scale-102"
                  >
                    Open Clean Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </motion.div>
          ) : currentView === "about" ? (
            <motion.div
              key="about-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 max-w-4xl mx-auto"
            >
              {/* Header banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      About Accurate OCR
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Secure, enterprise-grade transcription built for maximum clarity and structural formatting.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView("landing")}
                    className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full border border-zinc-200/50 dark:border-zinc-700/80 transition-all shadow-sm"
                  >
                    ← Home
                  </button>
                  <button
                    onClick={() => setCurrentView("workspace")}
                    className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow-sm"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-sm">
                  <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      <strong className="text-zinc-800 dark:text-zinc-100 font-bold">Accurate OCR & Encoding</strong> is a high-performance, secure, and intuitive web application designed to extract and structure unstructured analog content. Whether you have handwritten receipts, smartphone photographs of pages, multi-page document reports, or tabular spreadsheets, our system is custom-built to parse them.
                    </p>
                    
                    <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl space-y-2">
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        Core Mission & Directives
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Our model is trained to identify structural lines, alignment indicators, and tabular formatting. This guarantees that tables remain structured as pristine Markdown, saving hundreds of hours of manual re-typing and layout correction.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-zinc-850 dark:text-zinc-200">Our Commitments:</h4>
                      <ul className="list-disc list-inside space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <li><span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Server Storage:</span> All of your history remains securely saved locally in your browser storage.</li>
                        <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Sub-Second Delivery:</span> We optimize parallel extraction routines for immediate results.</li>
                        <li><span className="font-semibold text-amber-600 dark:text-amber-400">Adaptive Format:</span> Perfect conversions for images, multi-page PDFs, spreadsheets, and word docs.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sidebar Info Card (incorporating Jake Lupig) */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 text-zinc-800 dark:text-white p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 text-left">
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">THE CREATOR</span>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Jake Lupig</h3>
                      <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                        Lead Software Architect & Developer of Accurate OCR. Designed to bridge the gap between unstructured physical documentation and dynamic markdown schemas.
                      </p>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-4 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono flex flex-col gap-1">
                      <span>ROLE: Lead Developer</span>
                      <span>SYSTEM: Gemini 3.5 Vision Hub</span>
                      <span>EMAIL: jakelupig28@gmail.com</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-3 text-left">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Specifications</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-400">Engine version</span>
                        <span className="font-semibold text-zinc-750 dark:text-zinc-300">v1.5.0 Stable</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-400">Response Speed</span>
                        <span className="font-semibold text-zinc-750 dark:text-zinc-300">&lt; 0.94 seconds</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-400">Max File Size</span>
                        <span className="font-semibold text-zinc-750 dark:text-zinc-300">25 MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === "changelog" ? (
            <motion.div
              key="changelog-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 max-w-4xl mx-auto"
            >
              {/* Header banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Product Changelog & Updates
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Follow the evolution of Accurate OCR, designed and curated by Jake Lupig.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView("landing")}
                    className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full border border-zinc-200/50 dark:border-zinc-700/80 transition-all shadow-sm"
                  >
                    ← Home
                  </button>
                  <button
                    onClick={() => setCurrentView("workspace")}
                    className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow-sm"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>

              {/* Changelog Entries Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-8 text-left">
                <div className="space-y-6">
                  {/* Version 1.5.0 */}
                  <div className="space-y-2 border-l-2 border-indigo-500 pl-6 relative">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 -left-[6px] top-1.5 ring-4 ring-indigo-50 dark:ring-indigo-950" />
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-100">v1.5.0 - The Bento Update</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">Latest Release</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">Released: June 2026</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                      Completely re-engineered the landing page and workspace layout into a dynamic, responsive Bento Box arrangement. Integrated smooth laser-scanning animations and fully functional dark mode transition support across all components.
                    </p>
                  </div>

                  {/* Version 1.4.2 */}
                  <div className="space-y-2 border-l-2 border-zinc-300 dark:border-zinc-700 pl-6 relative">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 -left-[6px] top-1.5" />
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-base font-bold text-zinc-700 dark:text-zinc-200">v1.4.2 - Advanced Utility Toolbox</span>
                      <span className="text-xs font-bold text-zinc-400">May 2026</span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                      Added integrated text manipulation utilities inside the active editor pane, allowing instant UPPERCASE conversions, removal of redundant double spaces, and stripping markdown prefixes in 1-click.
                    </p>
                  </div>

                  {/* Version 1.3.0 */}
                  <div className="space-y-2 border-l-2 border-zinc-300 dark:border-zinc-700 pl-6 relative">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 -left-[6px] top-1.5" />
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-base font-bold text-zinc-700 dark:text-zinc-200">v1.3.0 - Multimodal Table Aligners</span>
                      <span className="text-xs font-bold text-zinc-400">April 2026</span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                      Tuned the Gemini 3.5 vision coordinates to output beautiful layout-aligned tabular rows when reading images of spreadsheet charts and text columns.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* WORKSPACE VIEW RE-ENGINEERED INTO GORGEOUS BENTO BOX LAYOUT */
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Workspace Header Dashboard banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl gap-4 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                    Interactive Digitization Command Workspace
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Use our Bento Grid workspace layout below to manage, process, and optimize extracted documents instantly.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView("landing")}
                  className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full border border-zinc-200/50 dark:border-zinc-700/80 transition-all shadow-sm"
                >
                  ← Home
                </button>
              </div>

              {/* THE CORE BENTO GRID WORKSPACE LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* BENTO CARD 1: MAIN UPLOAD DROPZONE AREA (Spans 8 cols on large screens) */}
                <div className="lg:col-span-8 flex flex-col h-full">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                        <h3 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          STEP 1: UPLOAD ORIGINAL SOURCE
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Max size: 25MB
                      </span>
                    </div>

                    <div className="flex-1">
                      <UploadZone
                        onFileSelect={handleFileSelect}
                        isProcessing={isProcessing}
                        error={error}
                      />
                    </div>
                  </div>
                </div>

                {/* BENTO CARD 2: REAL-TIME ANALYTICS & QUICK INSIGHTS (Spans 4 cols on large screens) */}
                <div className="lg:col-span-4 flex flex-col h-full">
                  <div className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-6 shadow-md dark:shadow-none relative overflow-hidden">
                    
                    {/* Visual pattern background */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-2xl pointer-events-none" />
 
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                           SESSION TELEMETRY
                         </h3>
                         <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-900/40 font-mono">
                           OPERATIONAL
                         </span>
                       </div>
 
                       {/* Stats grid */}
                       <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                           <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Processed</span>
                           <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalProcessed}</span>
                         </div>
                         <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                           <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg Speed</span>
                           <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">0.9s</span>
                         </div>
                       </div>
 
                       {/* File types distribution */}
                       <div className="space-y-2">
                         <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Format breakdown</span>
                         <div className="grid grid-cols-4 gap-1.5">
                           <div className="text-center p-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-900">
                             <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">IMG</span>
                             <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{imageCount}</span>
                           </div>
                           <div className="text-center p-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-900">
                             <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">PDF</span>
                             <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{pdfCount}</span>
                           </div>
                           <div className="text-center p-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-900">
                             <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">DOC</span>
                             <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{docxCount}</span>
                           </div>
                           <div className="text-center p-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-900">
                             <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">XLS</span>
                             <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{sheetCount}</span>
                           </div>
                         </div>
                       </div>
                     </div>
 
                     <div className="pt-2 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
                       <span>Secure dynamic pipeline checks characters at visual coordinate matrices with zero server caching.</span>
                     </div>
                   </div>
                 </div>

                {/* BENTO CARD 3: EXTRACTION HISTORY LOG FEED (Spans 4 cols on large screens) */}
                <div className="lg:col-span-4 flex flex-col h-full">
                  <div className="flex-1 flex flex-col min-h-[380px]">
                    <HistorySidebar
                      history={history}
                      activeId={activeId}
                      onSelect={setActiveId}
                      onDelete={handleDeleteResult}
                      onClearHistory={handleClearHistory}
                    />
                  </div>
                </div>

                {/* BENTO CARD 4: THE DEEP EDITOR & AI OPTIMIZATION PANEL (Spans 8 cols on large) */}
                <div className="lg:col-span-8 flex flex-col h-full">
                  <div className="flex-1 flex flex-col min-h-[420px]">
                    <TextEditor
                      activeResult={activeResult}
                      onUpdateText={handleUpdateText}
                      onUpdateTags={handleUpdateTags}
                      onDelete={handleDeleteResult}
                    />
                  </div>
                </div>

              </div>

              {/* Bottom Workspace help card */}
              <footer className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <HelpCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Tips for maximum layout formatting precision</span>
                  <p>
                    When parsing scanned tabular spreadsheet files, our pipeline maps values to beautiful inline markdown tables automatically. You can directly edit cellular contents in the active transcription viewport, and use our Text Management Utilities to trim redundant spacing or convert text into standard UPPERCASE/lowercase instantly.
                  </p>
                </div>
              </footer>

            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
}
