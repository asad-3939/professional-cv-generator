import React, { useState, useRef, useEffect } from "react";
import { 
  FileDown, Printer, FileImage, ChevronDown, Loader2, Sparkles, Check
} from "lucide-react";

interface DownloadDropdownProps {
  onExport: (format: "pdf" | "vector-pdf" | "png") => void;
  isExporting: "pdf" | "vector-pdf" | "png" | null;
  disabled?: boolean;
}

export const DownloadDropdown: React.FC<DownloadDropdownProps> = ({
  onExport,
  isExporting,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectFormat = (format: "pdf" | "vector-pdf" | "png") => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="download_dropdown_container">
      {/* Primary Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        disabled={disabled || isExporting !== null}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-bold tracking-tight shadow-sm transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shrink-0"
        title="Choose a download format (PDF, Vector ATS, PNG)"
        id="download_dropdown_trigger_btn"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span>Download</span>
            <ChevronDown className={`w-3.5 h-3.5 text-indigo-200 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 sm:w-72 origin-top-right bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800/60"
          role="menu"
          id="download_dropdown_menu"
        >
          <div className="px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Options</span>
          </div>

          <div className="py-1 space-y-1">
            {/* Option 1: Standard Optimized PDF */}
            <button
              onClick={() => handleSelectFormat("pdf")}
              className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-xs group cursor-pointer"
              role="menuitem"
              id="download_opt_pdf"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileDown className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">Download PDF</span>
                  <span className="text-[10px] font-medium text-slate-400">&lt;300 KB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Ultra-compact formatted PDF, ideal for online job portals & email.
                </p>
              </div>
            </button>

            {/* Option 2: Vector ATS PDF */}
            <button
              onClick={() => handleSelectFormat("vector-pdf")}
              className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-xs group cursor-pointer"
              role="menuitem"
              id="download_opt_vector_pdf"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white group-hover:text-teal-300 transition-colors">ATS / Vector PDF</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                    ATS-Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  100% selectable vector typography for enterprise ATS scanners.
                </p>
              </div>
            </button>

            {/* Option 3: PNG Image */}
            <button
              onClick={() => handleSelectFormat("png")}
              className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-xs group cursor-pointer"
              role="menuitem"
              id="download_opt_png"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                <FileImage className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-slate-200 transition-colors">Download PNG</span>
                  <span className="text-[10px] font-medium text-slate-400">High-Res</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  High-definition image snapshot for social portfolios & previews.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
