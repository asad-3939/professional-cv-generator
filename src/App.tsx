import { useState, useEffect, useRef } from "react";
import { 
  FileDown, RotateCcw, Printer, Sparkles, AlertCircle, CheckCircle, HelpCircle, Eye, FileImage,
  Edit3, LogOut, LogIn, User as UserIcon, LayoutDashboard
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";

// Data & Types
import { CVData, DesignConfig, TemplateId } from "./types";
import { initialCVData, initialDesignConfig } from "./sampleData";

// Components
import { CVForm } from "./components/CVForm";
import { ResumeTemplates } from "./components/ResumeTemplates";
import { AuthModal } from "./components/AuthModal";
import { UserDashboard } from "./components/UserDashboard";
import { Homepage } from "./components/Homepage";
import { AIAssistantModal } from "./components/AIAssistantModal";

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
  const [isExporting, setIsExporting] = useState<"pdf" | "png" | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [activeMobileTab, setActiveMobileTab] = useState<"edit" | "preview">("edit");
  const [viewMode, setViewMode] = useState<"landing" | "builder">("landing");
  const [formActiveTab, setFormActiveTab] = useState<string>("personal");

  // User States
  const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string; uid: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [aiAssistantInitialTab, setAiAssistantInitialTab] = useState<"import" | "ats">("import");

  const isInitialAuthCheck = useRef<boolean>(true);

  // Sync user state from Firebase on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loggedUser = {
          email: user.email || "",
          displayName: user.displayName || user.email || "Google User",
          uid: user.uid
        };
        setCurrentUser(loggedUser);
        
        // Fetch saved profile from Firestore if it exists
        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("./lib/firebase");
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.cvData) {
              setCvData(data.cvData);
              if (isInitialAuthCheck.current) {
                setSuccessToast(`Welcome back, ${loggedUser.displayName}! Loaded your CV from Cloud.`);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load saved CV from Firestore:", err);
        }
      } else {
        setCurrentUser(null);
      }
      isInitialAuthCheck.current = false;
    });
    return () => unsubscribe();
  }, []);

  // Auto-fit preview scale to screen size dynamically on mobile/tablet devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Compute standard fit scale for viewport minus padding
        const targetScale = Math.min(1.0, Math.max(0.35, (window.innerWidth - 32) / 794));
        setPreviewScale(targetScale);
      } else {
        setPreviewScale(0.8);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    // If not signed in, automatically trigger Auth Modal
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setErrorToast("Please sign in with Google to download your CV.");
      return;
    }

    if (!cvPreviewRef.current) return;
    setIsExporting(format);
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

            // 3. Match OKLCH & OKLAB values (including nested parentheses for CSS vars, e.g. var(--tw-bg-opacity))
            const oklchRegex = /okl(ch|ab)\((?:[^)(]+|\([^)(]*\))*\)/g;

            // Setup a temporary off-screen div on host document to resolve computed oklch/oklab to standard legacy RGB natively
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

            // 4. Inject fully processed, oklch/oklab-free, standard legacy RGB CSS stylesheet
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

            // 5. Sanitize any inline style attributes where components might have defined local oklch/oklab
            const inlineStyleNodes = clonedDoc.querySelectorAll("[style]");
            inlineStyleNodes.forEach((nodeEl) => {
              const inlineStyle = nodeEl.getAttribute("style") || "";
              if (inlineStyle.includes("oklch") || inlineStyle.includes("oklab")) {
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

      // Reset loading state immediately once download is triggered
      setIsExporting(null);

      // Log download to Firestore subcollection if user is signed in as a non-blocking background task
      if (currentUser) {
        import("firebase/firestore").then(async ({ collection, addDoc, doc, setDoc, arrayUnion, increment }) => {
          const { db } = await import("./lib/firebase");
          const newDownload = {
            timestamp: new Date().toISOString(),
            format: format,
            fileName: `${fileNameStr}_CV.${format}`
          };

          // Update main user document with the count and log entry in the background
          setDoc(doc(db, "users", currentUser.uid), {
            downloadsCount: increment(1),
            downloads: arrayUnion(newDownload)
          }, { merge: true }).then(() => {
            console.log("Successfully recorded CV download count in Firestore.");
          }).catch(err => {
            console.error("Error updating download count in Firestore:", err);
          });

          // Also add a snapshot to history subcollection in the background
          addDoc(collection(db, "users", currentUser.uid, "history"), {
            timestamp: new Date().toISOString(),
            format: format,
            fileName: `${fileNameStr}_CV.${format}`,
            cvData: cvData,
            designConfig: designConfig
          }).then(() => {
            console.log("Successfully recorded CV history snapshot in Firestore.");
          }).catch(err => {
            console.error("Error recording CV history in Firestore:", err);
          });
        }).catch(fsErr => {
          console.error("Failed to import Firestore in background:", fsErr);
        });
      }
    } catch (error: any) {
      console.error("Export crash error:", error);
      setErrorToast(error.message || "Export process failed. Contact administrator.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 font-sans tracking-tight text-slate-100 select-none ${
      viewMode === "landing" ? "min-h-screen overflow-y-auto" : "h-screen overflow-hidden"
    }`}>
      
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

      {viewMode === "landing" ? (
        <Homepage 
          currentUser={currentUser}
          onStartBuilding={(templateId, initialTab) => {
            if (templateId) {
              setDesignConfig(prev => ({ ...prev, templateId }));
            }
            if (initialTab) {
              setFormActiveTab(initialTab);
            } else {
              setFormActiveTab("personal");
            }
            setViewMode("builder");
          }}
          onSignIn={() => {
            setSuccessToast(null);
            setErrorToast(null);
            setIsAuthModalOpen(true);
          }}
          onSignOut={() => {
            signOut(auth);
            setSuccessToast("Signed out successfully!");
          }}
          onOpenDashboard={() => setIsHistoryModalOpen(true)}
          onOpenAIImport={() => {
            setIsAIAssistantOpen(true);
          }}
        />
      ) : (
        <>
          {/* Primary Top Utilities Header Bar */}
          <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 relative z-30 shadow-md">
            <div 
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-90 select-none group"
              title="Go to Homepage"
              id="header_logo_home_btn"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-lg shadow-indigo-500/10 shrink-0 group-hover:scale-[1.03] transition-transform">
                AI
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
                  <span className="hidden sm:inline">AI Professional CV Builder</span>
                  <span className="inline sm:hidden font-black">AI CV Builder</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Automatic PDF formatter and resume writer • <span className="text-indigo-400 font-semibold">developed by Asad Mustafa</span></p>
              </div>
            </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* AI Import Parser */}
          <button
            onClick={() => {
              setIsAIAssistantOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-md text-xs font-bold tracking-tight shadow-md cursor-pointer transition select-none shrink-0"
            title="Open AI CV Parser & Importer"
            id="header_ai_assistant_btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI CV Parser</span>
          </button>
          
          {/* Restart/Reset draft */}
          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer transition select-none"
            title="Reset to initial default template values"
            id="reset_template_btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Draft</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting !== null}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white rounded-md text-xs font-bold tracking-tight shadow-md cursor-pointer transition select-none shrink-0"
            id="download_pdf_btn"
          >
            {isExporting === "pdf" ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Exporting...</span>
                <span className="inline sm:hidden">...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="hidden sm:inline">PDF Download</span>
                <span className="inline sm:hidden">PDF</span>
              </>
            )}
          </button>

          {/* Download PNG button */}
          <button
            onClick={() => handleExport("png")}
            disabled={isExporting !== null}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-md text-xs font-bold tracking-tight shadow-md cursor-pointer transition select-none shrink-0"
            id="download_png_btn"
          >
            {isExporting === "png" ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Exporting...</span>
                <span className="inline sm:hidden">...</span>
              </>
            ) : (
              <>
                <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="hidden sm:inline">PNG Image</span>
                <span className="inline sm:hidden">PNG</span>
              </>
            )}
          </button>

          {/* User Auth controls */}
          {currentUser ? (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3 ml-1.5" id="user-header-profile">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-bold transition select-none cursor-pointer shrink-0"
                title="View My Dashboard & CV History"
                id="header_dashboard_btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">My Dashboard</span>
              </button>

              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-bold text-white max-w-[120px] truncate leading-none">
                  {currentUser.displayName}
                </span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-[120px] truncate">
                  {currentUser.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs shadow shrink-0">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => {
                  signOut(auth);
                  setSuccessToast("Signed out successfully!");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-bold transition select-none cursor-pointer shrink-0"
                title="Sign Out"
                id="sign_out_btn"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSuccessToast(null);
                setErrorToast(null);
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-md text-xs font-bold transition select-none cursor-pointer shrink-0 ml-1.5"
              id="header_login_btn"
            >
              <LogIn className="w-3.5 h-3.5 text-white" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </header>

      {/* Mobile Tab Control Switcher */}
      <div className="md:hidden flex bg-slate-900 border-b border-slate-800 p-1.5 shrink-0 select-none">
        <button
          onClick={() => setActiveMobileTab("edit")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
            activeMobileTab === "edit"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="mobile_tab_edit_btn"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
            activeMobileTab === "preview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="mobile_tab_preview_btn"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Main Workspace Frame (Responsive Dual Panel) */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Panel 1: Left Form Configuration (Editable) */}
        <div className={`w-full md:w-[48%] lg:w-[42%] xl:w-[38%] shrink-0 h-full relative overflow-hidden flex flex-col ${
          activeMobileTab === "edit" ? "flex" : "hidden md:flex"
        }`}>
          <CVForm 
            data={cvData} 
            onChange={setCvData} 
            design={designConfig}
            onDesignChange={setDesignConfig}
            currentUser={currentUser}
            activeTab={formActiveTab}
            onActiveTabChange={setFormActiveTab}
          />
        </div>

        {/* Panel 2: Right Interactive A4 sheet preview */}
        <div className={`flex-grow h-full bg-slate-950 p-4 md:p-6 flex flex-col items-center justify-start overflow-y-auto relative border-t md:border-t-0 md:border-l border-slate-800 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] ${
          activeMobileTab === "preview" ? "flex" : "hidden md:flex"
        }`}>
          
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
        </>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setSuccessToast(`Successfully signed in as ${user.displayName}!`);
        }}
      />

      <UserDashboard
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentUser={currentUser}
        onRestoreCV={(restoredCv, restoredDesign) => {
          setCvData(restoredCv);
          if (restoredDesign) {
            setDesignConfig(restoredDesign);
          }
          setIsHistoryModalOpen(false); // Auto close the dashboard so they view the file instantly in the editor
          setViewMode("builder"); // Seamless transition to the builder view
          setSuccessToast("Successfully restored chosen CV snapshot and style layout!");
        }}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        currentCVData={cvData}
        currentUser={currentUser}
        onImportSuccess={(parsedCV) => {
          setCvData(parsedCV);
          setViewMode("builder");
          setSuccessToast("Excellent! Gemini AI parsed and successfully populated your new CV!");
        }}
      />

    </div>
  );
}
