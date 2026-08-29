import { useState, useEffect, useRef } from "react";
import { 
  FileDown, RotateCcw, Printer, Sparkles, AlertCircle, CheckCircle, HelpCircle, Eye, FileImage,
  Edit3, LogOut, LogIn, User as UserIcon, LayoutDashboard, FileText
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { exportOptimizedPDF, exportVectorATSPDF, exportHighResPNG } from "./utils/pdfExport";

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
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";

export type AppRoute = "home" | "builder" | "privacy" | "terms";

export default function App() {
  // Client-side route state matching browser URL path
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
      if (p === "/privacy") return "privacy";
      if (p === "/terms") return "terms";
      if (p === "/builder") return "builder";
    }
    return "home";
  });

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    const targetPath = route === "home" ? "/" : `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    if (route === "home") {
      document.title = "AI Professional CV Builder";
    } else if (route === "builder") {
      document.title = "CV Builder Workspace | AI Professional CV Builder";
    }
  };

  // Sync with browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
      if (p === "/privacy") {
        setCurrentRoute("privacy");
      } else if (p === "/terms") {
        setCurrentRoute("terms");
      } else if (p === "/builder") {
        setCurrentRoute("builder");
      } else {
        setCurrentRoute("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
  const [isExporting, setIsExporting] = useState<"pdf" | "vector-pdf" | "png" | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [activeMobileTab, setActiveMobileTab] = useState<"edit" | "preview">("edit");
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

  // Refactored high performance PDF / Vector ATS / PNG generation
  const handleExport = async (format: "pdf" | "vector-pdf" | "png") => {
    // If not signed in, automatically trigger Auth Modal
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setErrorToast("Please sign in with Google to download your CV.");
      return;
    }

    if (!cvPreviewRef.current) return;
    setIsExporting(format);
    setErrorToast(null);

    const fileNameStr = cvData.personal.fullName.trim() 
      ? cvData.personal.fullName.replace(/\s+/g, "_") 
      : "Professional";

    try {
      const element = document.getElementById("cv-pdf-render-target");
      if (!element) {
        throw new Error("Preview layout structure target missing.");
      }

      if (format === "vector-pdf") {
        // Option A: True Vector ATS PDF via native browser vector print pipeline
        exportVectorATSPDF("cv-pdf-render-target", {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => setErrorToast(err.message),
        });
      } else if (format === "pdf") {
        // Option B: Ultra-optimized direct PDF download (<300 KB file size)
        await exportOptimizedPDF(element, {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => setErrorToast(err.message),
        });
      } else {
        // Crisp PNG image download
        await exportHighResPNG(element, {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => setErrorToast(err.message),
        });
      }

      // Log download to Firestore subcollection if user is signed in
      if (currentUser) {
        import("firebase/firestore").then(async ({ collection, addDoc, doc, setDoc, arrayUnion, increment }) => {
          const { db } = await import("./lib/firebase");
          const logFormat = format === "vector-pdf" ? "pdf" : format;
          const newDownload = {
            timestamp: new Date().toISOString(),
            format: logFormat,
            fileName: `${fileNameStr}_CV.${logFormat}`
          };

          setDoc(doc(db, "users", currentUser.uid), {
            downloadsCount: increment(1),
            downloads: arrayUnion(newDownload)
          }, { merge: true }).catch(err => {
            console.warn("Error updating download count in Firestore:", err);
          });

          addDoc(collection(db, "users", currentUser.uid, "history"), {
            timestamp: new Date().toISOString(),
            format: logFormat,
            fileName: `${fileNameStr}_CV.${logFormat}`,
            cvData: cvData,
            designConfig: designConfig
          }).catch(err => {
            console.warn("Error recording CV history in Firestore:", err);
          });
        }).catch(fsErr => {
          console.warn("Background Firestore logging notice:", fsErr);
        });
      }
    } catch (error: any) {
      console.error("Export process notice:", error);
      setErrorToast(error.message || "Export process encountered an issue. Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 font-sans tracking-tight text-slate-100 select-none ${
      currentRoute === "builder" ? "h-screen overflow-hidden" : "min-h-screen overflow-y-auto"
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

      {/* Page Routing Views */}
      {currentRoute === "privacy" ? (
        <PrivacyPolicy 
          onNavigateHome={() => navigateTo("home")}
          onNavigateTerms={() => navigateTo("terms")}
          onNavigateBuilder={() => navigateTo("builder")}
        />
      ) : currentRoute === "terms" ? (
        <TermsOfService 
          onNavigateHome={() => navigateTo("home")}
          onNavigatePrivacy={() => navigateTo("privacy")}
          onNavigateBuilder={() => navigateTo("builder")}
        />
      ) : currentRoute === "home" ? (
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
            navigateTo("builder");
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
          onNavigatePrivacy={() => navigateTo("privacy")}
          onNavigateTerms={() => navigateTo("terms")}
        />
      ) : (
        <>
          {/* Primary Top Utilities Header Bar */}
          <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 relative z-30 shadow-md">
            <div 
              onClick={() => navigateTo("home")}
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
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5">Automatic PDF formatter and resume writer</p>
              </div>
            </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Import Resume Button */}
          <button
            onClick={() => {
              setIsAIAssistantOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
            title="Import existing resume from PDF, Word, or text"
            id="header_ai_assistant_btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Import Resume</span>
          </button>
          
          {/* Restart/Reset draft */}
          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition select-none"
            title="Reset to default template draft"
            id="reset_template_btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Draft</span>
          </button>

          {/* Download PDF button (Ultra-optimized <300KB) */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
            title="Download ultra-optimized PDF file (<300 KB)"
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
                <span className="hidden sm:inline">Download PDF</span>
                <span className="inline sm:hidden">PDF</span>
              </>
            )}
          </button>

          {/* Vector ATS Print button (100% Vector Text, Selectable, ATS-Friendly) */}
          <button
            onClick={() => handleExport("vector-pdf")}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
            title="Print or Save as 100% Vector ATS-compliant PDF"
            id="print_vector_pdf_btn"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            <span className="hidden lg:inline">Vector ATS</span>
            <span className="inline lg:hidden">Print</span>
          </button>

          {/* Download PNG button */}
          <button
            onClick={() => handleExport("png")}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
            title="Download as PNG image"
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
                <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                <span className="hidden sm:inline">PNG Image</span>
                <span className="inline sm:hidden">PNG</span>
              </>
            )}
          </button>

          {/* User Auth controls */}
          {currentUser ? (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3 ml-1" id="user-header-profile">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold transition select-none cursor-pointer shrink-0"
                title="View My Saved Resumes & History"
                id="header_dashboard_btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Dashboard</span>
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
                  setSuccessToast("Signed out successfully.");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-medium transition select-none cursor-pointer shrink-0"
                title="Sign Out"
                id="sign_out_btn"
              >
                <LogOut className="w-3.5 h-3.5" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition select-none cursor-pointer shrink-0 ml-1"
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

      {/* Builder Minimal Bottom Navigation Footer */}
      <footer className="h-7 bg-slate-950 border-t border-slate-850 px-4 flex items-center justify-between text-[11px] text-slate-500 shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">AI Professional CV Builder</span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="hidden sm:inline text-slate-500">Auto-saved to local draft & cloud profile</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo("privacy")} 
            className="hover:text-slate-300 transition cursor-pointer"
            id="builder_footer_privacy_btn"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => navigateTo("terms")} 
            className="hover:text-slate-300 transition cursor-pointer"
            id="builder_footer_terms_btn"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => navigateTo("home")} 
            className="hover:text-indigo-400 transition cursor-pointer font-medium"
            id="builder_footer_home_btn"
          >
            Home
          </button>
        </div>
      </footer>
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
          navigateTo("builder"); // Seamless transition to the builder view
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
          navigateTo("builder");
          setSuccessToast("Resume imported and populated successfully!");
        }}
      />

    </div>
  );
}
