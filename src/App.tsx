import { useState, useEffect, useRef } from "react";
import { 
  FileDown, RotateCcw, Printer, Sparkles, AlertCircle, CheckCircle, HelpCircle, Eye, FileImage
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Data & Types
import { CVData, DesignConfig } from "./types";
import { initialCVData, initialDesignConfig } from "./sampleData";

// Components
import { CVForm } from "./components/CVForm";
import { ResumeTemplates } from "./components/ResumeTemplates";

export default function App() {
  // Load data from localStorage or fallback to template data
  const [cvData, setCvData] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem("aura_cv_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Prune older states for testing users to ensure fresh generic template is rendered
        if (
          parsed.personal?.fullName === "Alex Mercer" || 
          parsed.personal?.fullName === "Asad Mustafa" || 
          parsed.personal?.fullName === "ASAD" ||
          !parsed.personal?.fullName
        ) {
          return initialCVData;
        }
        return parsed;
      }
      return initialCVData;
    } catch {
      return initialCVData;
    }
  });

  const [designConfig, setDesignConfig] = useState<DesignConfig>(() => {
    try {
      const saved = localStorage.getItem("aura_cv_design");
      return saved ? JSON.parse(saved) : initialDesignConfig;
    } catch {
      return initialDesignConfig;
    }
  });

  // Action status triggers
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.85);

  const cvPreviewRef = useRef<HTMLDivElement | null>(null);

  // Auto-save mechanisms with local storage
  useEffect(() => {
    localStorage.setItem("aura_cv_data", JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem("aura_cv_design", JSON.stringify(designConfig));
  }, [designConfig]);

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const t = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [errorToast]);

  // Reset to starter template
  const handleResetToSample = () => {
    if (window.confirm("Are you sure you want to restore the default sample CV information? This will overwrite your current draft.")) {
      setCvData(initialCVData);
      setDesignConfig(initialDesignConfig);
      setSuccessToast("Restored starter resume layout and credentials!");
    }
  };

  // High quality PDF / PNG generation
  const handleExport = async (format: "pdf" | "png") => {
    if (!cvPreviewRef.current) return;
    setIsExporting(true);
    setErrorToast(null);

    try {
      // Find rendered DOM node
      const element = document.getElementById("cv-pdf-render-target");
      if (!element) {
        throw new Error("Preview layout structure target missing.");
      }

      // Add special class to enforce temporary full resolution scale
      const originalStyle = element.style.transform;
      element.style.transform = "none";

      // Render crisp image from HTML elements using html2canvas
      const scaleValue = 2.5; // High output resolution (240 DPI equivalent)
      const canvas = await html2canvas(element, {
        scale: scaleValue,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, // Standard A4 width reference
        windowHeight: 1123, // Standard A4 height reference
        onclone: (clonedDoc) => {
          // Fix for html2canvas crashing on Tailwind CSS v4's oklch() color syntax
          try {
            // 1. Gather all CSS rules from host document stylesheets (which include all Tailwind compiled rules)
            let combinedCSSText = "";
            for (let i = 0; i < document.styleSheets.length; i++) {
              try {
                const sheet = document.styleSheets[i];
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                  for (let j = 0; j < rules.length; j++) {
                    combinedCSSText += rules[j].cssText + "\n";
                  }
                }
              } catch (err) {
                console.warn("Could not read stylesheet rules from host:", err);
              }
            }

            // 2. Remove all link[rel="stylesheet"] elements and inline style tags from clonedDoc
            // to prevent html2canvas from fetching raw un-transformed stylesheets containing oklch
            const clonedLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            clonedLinks.forEach((el) => el.remove());

            const clonedStyles = clonedDoc.querySelectorAll('style');
            clonedStyles.forEach((el) => el.remove());

            // 3. Match OKLCH values (including nested parentheses for CSS vars, e.g. var(--tw-bg-opacity))
            const oklchRegex = /oklch\((?:[^)(]+|\([^)(]*\))*\)/g;

            // Setup a temporary off-screen div on host document to resolve computed oklch to standard legacy RGB natively
            const tempEl = document.createElement("div");
            tempEl.style.display = "none";
            document.body.appendChild(tempEl);

            const oklchCache = new Map();
            const convertOklch = (match: string) => {
              if (oklchCache.has(match)) {
                return oklchCache.get(match);
              }
              try {
                tempEl.style.color = "";
                tempEl.style.color = match;
                const computed = window.getComputedStyle(tempEl).color;
                if (computed && (computed.startsWith("rgb") || computed.startsWith("#") || computed === "transparent")) {
                  oklchCache.set(match, computed);
                  return computed;
                }
              } catch {
                // fall through to default fallback
              }
              return "rgb(120, 120, 120)"; // neutral dark-gray fallback
            };

            // 4. Inject fully processed, oklch-free, standard legacy RGB CSS stylesheet
            if (combinedCSSText) {
              const sanitizedCSSText = combinedCSSText.replace(oklchRegex, convertOklch);
              const legacyStyleTag = clonedDoc.createElement("style");
              legacyStyleTag.textContent = sanitizedCSSText;
              clonedDoc.head.appendChild(legacyStyleTag);
            } else {
              // Fallback: if we were unable to serialize host stylesheets, restore cloned style tags and sanitize them
              clonedStyles.forEach((styleTag) => {
                const text = styleTag.textContent || "";
                const sanitized = text.replace(oklchRegex, convertOklch);
                const restoredStyle = clonedDoc.createElement("style");
                restoredStyle.textContent = sanitized;
                clonedDoc.head.appendChild(restoredStyle);
              });
            }

            // 5. Sanitize any inline style attributes where components might have defined local oklch
            const inlineStyleNodes = clonedDoc.querySelectorAll("[style]");
            inlineStyleNodes.forEach((nodeEl) => {
              const inlineStyle = nodeEl.getAttribute("style") || "";
              if (inlineStyle.includes("oklch")) {
                const sanitizedInline = inlineStyle.replace(oklchRegex, convertOklch);
                nodeEl.setAttribute("style", sanitizedInline);
              }
            });

            // Cleanup host helper element
            if (tempEl.parentNode) {
              tempEl.parentNode.removeChild(tempEl);
            }
          } catch (e) {
            console.error("Failed to parse and patch oklch stylesheet styles", e);
          }

          const target = clonedDoc.getElementById("cv-pdf-render-target");
          if (target) {
            // Isolate layout from any parent transform/margins/paddings or width constraints
            clonedDoc.body.innerHTML = "";
            clonedDoc.body.appendChild(target);

            target.style.transform = "none";
            target.style.boxShadow = "none";
            target.style.borderRadius = "0px";
            target.style.width = "794px";
            target.style.minHeight = "1123px";
            target.style.margin = "0";
            target.style.padding = "0";

            clonedDoc.body.style.margin = "0";
            clonedDoc.body.style.padding = "0";
            clonedDoc.body.style.width = "794px";
            clonedDoc.body.style.backgroundColor = "#ffffff";
          }
        }
      });

      // Restore scale
      element.style.transform = originalStyle;

      const imgData = canvas.toDataURL("image/png");
      const fileNameStr = cvData.personal.fullName.trim() 
        ? cvData.personal.fullName.replace(/\s+/g, "_") 
        : "Professional";

      if (format === "pdf") {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const pdfWidth = 210; // A4 mm dimensions
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileNameStr}_CV.pdf`);
        setSuccessToast(`Successfully downloaded polished ${designConfig.templateId} style CV PDF!`);
      } else {
        const link = document.createElement("a");
        link.download = `${fileNameStr}_CV.png`;
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessToast(`Successfully downloaded polished ${designConfig.templateId} style CV Image (PNG)!`);
      }
    } catch (error: any) {
      console.error("Export crash error:", error);
      setErrorToast(error.message || "Export process failed. Contact administrator.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans tracking-tight text-slate-100 overflow-hidden select-none">
      
      {/* Dynamic Notifications */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-xl border border-emerald-500 animate-slide-in text-xs max-w-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-lg shadow-xl border border-rose-500 animate-slide-in text-xs max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Primary Top Utilities Header Bar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-lg shadow-indigo-500/10 shrink-0">
            AI
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
              AI Professional CV Builder
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Automatic PDF formatter and resume writer</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          
          {/* Restart/Reset draft */}
          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer transition select-none"
            title="Reset to initial default template values"
            id="reset_template_btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Draft</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white rounded-md text-xs font-bold tracking-tight shadow-md cursor-pointer transition select-none shrink-0"
            id="download_pdf_btn"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-white" />
                <span>PDF Download</span>
              </>
            )}
          </button>

          {/* Download PNG button */}
          <button
            onClick={() => handleExport("png")}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-md text-xs font-bold tracking-tight shadow-md cursor-pointer transition select-none shrink-0"
            id="download_png_btn"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileImage className="w-4 h-4 text-white" />
                <span>PNG Image</span>
              </>
            )}
          </button>

        </div>
      </header>

      {/* Main Workspace Frame (Responsive Dual Panel) */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Panel 1: Left Form Configuration (Editable) */}
        <div className="w-full md:w-[48%] lg:w-[42%] xl:w-[38%] shrink-0 h-1/2 md:h-full relative overflow-hidden flex flex-col">
          <CVForm 
            data={cvData} 
            onChange={setCvData} 
            design={designConfig}
            onDesignChange={setDesignConfig}
          />
        </div>

        {/* Panel 2: Right Interactive A4 sheet preview */}
        <div className="flex-grow h-1/2 md:h-full bg-slate-950 p-6 flex flex-col items-center justify-start overflow-y-auto relative border-t md:border-t-0 md:border-l border-slate-800 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]">
          
          <div className="w-full max-w-2xl flex justify-between items-center mb-4 text-slate-400 select-none shrink-0 border-b border-slate-900 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Real-time Print Preview (A4 Ratio Sheet)</span>
            </div>
            
            {/* View Zoom controls */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] hidden sm:inline uppercase tracking-widest text-slate-500 font-bold">Preview Scale</span>
              <div className="flex items-center gap-1.5 bg-slate-900 px-1.5 py-1 rounded border border-slate-800 text-[11px] font-mono">
                <button 
                  onClick={() => setPreviewScale(p => Math.max(0.5, p - 0.05))} 
                  className="px-1.5 hover:text-white transition cursor-pointer font-bold text-xs"
                >
                  -
                </button>
                <span className="text-slate-300 font-bold">{Math.round(previewScale * 100)}%</span>
                <button 
                  onClick={() => setPreviewScale(p => Math.min(1.2, p + 0.05))} 
                  className="px-1.5 hover:text-white transition cursor-pointer font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Scalable Container wrapper */}
          <div className="flex-grow w-full flex items-start justify-center p-2 relative">
            <div 
              style={{ 
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
                width: "794px", // Fixed standard DPI A4 width to keep layouts pristine
                margin: "0 auto",
                transition: "transform 0.15s ease-out"
              }}
              className="mb-20"
            >
              <ResumeTemplates 
                targetRef={cvPreviewRef}
                data={cvData} 
                design={designConfig}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
