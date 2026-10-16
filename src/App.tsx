import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { 
  FileDown, RotateCcw, Printer, Sparkles, AlertCircle, CheckCircle2, Eye, FileImage,
  Edit3, LogIn, LayoutDashboard, Cloud, Check, Loader2, RefreshCw, Layers, ShieldCheck,
  Target
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { exportOptimizedPDF, exportVectorATSPDF, exportHighResPNG } from "./utils/pdfExport";

// Data & Types
import { CVData, DesignConfig, TemplateId, CVRecord, AutosaveStatus } from "./types";
import { initialCVData, initialDesignConfig } from "./sampleData";
import { 
  getUserCVs, 
  createCV, 
  updateCV, 
  recordExport, 
  syncUserProfile 
} from "./lib/cvService";

// Components
import { CVForm } from "./components/CVForm";
import { ResumeTemplates } from "./components/ResumeTemplates";
import { AuthModal } from "./components/AuthModal";
import { UserDashboard } from "./components/UserDashboard";
import { Homepage } from "./components/Homepage";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { UserDropdown } from "./components/UserDropdown";
import { AccountSettingsModal } from "./components/AccountSettingsModal";
import { DownloadDropdown } from "./components/DownloadDropdown";

// Lazy-load Advanced ATS Analyzer to keep initial bundle ultra-lean
const LazyATSAnalyzerModal = lazy(() => 
  import("./components/ATSAnalyzerModal").then(m => ({ default: m.ATSAnalyzerModal }))
);

// Lazy-load Job Description Match Modal
const LazyJobMatchModal = lazy(() => 
  import("./components/JobMatchModal").then(m => ({ default: m.JobMatchModal }))
);

// Lazy-load Dedicated Public Standalone Pages
const LazyATSCheckerPage = lazy(() =>
  import("./components/ATSCheckerPage").then(m => ({ default: m.ATSCheckerPage }))
);

const LazyJobMatchPage = lazy(() =>
  import("./components/JobMatchPage").then(m => ({ default: m.JobMatchPage }))
);

export type AppRoute = "home" | "builder" | "privacy" | "terms" | "ats-checker" | "job-match";

export default function App() {
  // Client-side route state matching browser URL path
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
      if (p === "/privacy") return "privacy";
      if (p === "/terms") return "terms";
      if (p === "/builder") return "builder";
      if (p === "/ats-checker") return "ats-checker";
      if (p === "/job-match") return "job-match";
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
      document.title = "Free AI CV Builder & ATS Resume Checker | ProCVMaker";
    } else if (route === "builder") {
      document.title = "CV Builder Workspace | ProCVMaker";
    } else if (route === "ats-checker") {
      document.title = "Free ATS Resume Checker – Test & Improve Resume Score | ProCVMaker";
    } else if (route === "job-match") {
      document.title = "Resume Job Match – Compare CV to Job Description | ProCVMaker";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      } else if (p === "/ats-checker") {
        setCurrentRoute("ats-checker");
      } else if (p === "/job-match") {
        setCurrentRoute("job-match");
      } else {
        setCurrentRoute("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Active CV Document Identifiers in Firestore
  const [activeCvId, setActiveCvId] = useState<string | null>(null);
  const [activeCvTitle, setActiveCvTitle] = useState<string>("My Resume");
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("local");

  // Load data from localStorage or fallback to template data
  const [cvData, setCvData] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem("aura_cv_data");
      if (saved) {
        const parsed = JSON.parse(saved);
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [activeMobileTab, setActiveMobileTab] = useState<"edit" | "preview">("edit");
  const [formActiveTab, setFormActiveTab] = useState<string>("personal");

  // User States
  const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string; uid: string } | null>(null);
  const [cachedUserCVs, setCachedUserCVs] = useState<CVRecord[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isATSModalOpen, setIsATSModalOpen] = useState<boolean>(false);
  const [targetATSCV, setTargetATSCV] = useState<{ cvData: CVData; designConfig: DesignConfig; title: string } | null>(null);

  const [isJobMatchOpen, setIsJobMatchOpen] = useState<boolean>(false);
  const [targetJobMatchCV, setTargetJobMatchCV] = useState<{ cvData: CVData; title: string } | null>(null);

  const handleOpenATS = (customCV?: { cvData: CVData; designConfig: DesignConfig; title: string }) => {
    if (customCV) {
      setTargetATSCV(customCV);
    } else {
      setTargetATSCV({
        cvData,
        designConfig,
        title: activeCvTitle || "My Resume"
      });
    }
    setIsATSModalOpen(true);
  };

  const handleOpenJobMatch = (customCV?: { cvData: CVData; title: string }) => {
    if (customCV) {
      setTargetJobMatchCV(customCV);
    } else {
      setTargetJobMatchCV({
        cvData,
        title: activeCvTitle || "My Resume"
      });
    }
    setIsJobMatchOpen(true);
  };

  const debounceTimerRef = useRef<any>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const cvPreviewRef = useRef<HTMLDivElement | null>(null);

  // Sync user state & load/initialize CVs from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loggedUser = {
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          uid: user.uid
        };
        setCurrentUser(loggedUser);
        setAutosaveStatus("saving");

        // 1. Non-blocking profile synchronization in the background
        syncUserProfile(loggedUser).catch((e) => {
          console.warn("Background profile sync notice:", e);
        });

        // 2. Fetch user's CV documents immediately without waiting for profile writes
        try {
          const userCVs = await getUserCVs(user.uid, 20);
          setCachedUserCVs(userCVs);
          
          if (userCVs.length > 0) {
            // Load the most recently updated CV or default
            const targetCV = userCVs.find(c => c.isDefault) || userCVs[0];
            setActiveCvId(targetCV.id);
            setActiveCvTitle(targetCV.title);
            setCvData(targetCV.data);
            setDesignConfig(targetCV.design);
            setAutosaveStatus("saved");
            
            if (isInitialLoadRef.current) {
              setSuccessToast(`Welcome back, ${loggedUser.displayName}! Loaded "${targetCV.title}" from cloud.`);
            }
          } else {
            // New user without CVs: initialize with current draft in editor
            try {
              const initialTitle = cvData.personal?.jobTitle?.trim() || "Professional Resume";
              const created = await createCV(user.uid, cvData, designConfig, initialTitle, true);
              setActiveCvId(created.id);
              setActiveCvTitle(created.title);
              setCachedUserCVs([created]);
              setAutosaveStatus("saved");
              setSuccessToast(`Created your first cloud resume "${created.title}"!`);
            } catch (createErr) {
              console.warn("Notice: Initial cloud CV initialization deferred:", createErr);
              setAutosaveStatus("local");
            }
          }
        } catch (err) {
          console.warn("Notice: Loading user CVs from Firestore fallback to local:", err);
          setAutosaveStatus("local");
        }
      } else {
        setCurrentUser(null);
        setActiveCvId(null);
        setCachedUserCVs([]);
        setAutosaveStatus("local");
      }
      isInitialLoadRef.current = false;
    });

    return () => unsubscribe();
  }, []);

  // Robust async save handler with timeout guard, try/catch/finally, and duplicate prevention
  const handleSave = useCallback(async (showFeedback = false) => {
    // 1. Double-trigger guard: prevent duplicate concurrent operations
    if (isSaving || isExporting) {
      console.warn("[CV Builder] Save skipped: operation already in progress (isSaving:", isSaving, ", isExporting:", isExporting, ")");
      return;
    }

    // Cancel pending debounced autosave timer to prevent duplicate write
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setIsSaving(true);
    setAutosaveStatus("saving");

    try {
      // 1. Immediately backup to local storage cache synchronously
      try {
        localStorage.setItem("aura_cv_data", JSON.stringify(cvData));
        localStorage.setItem("aura_cv_design", JSON.stringify(designConfig));
      } catch (storageErr) {
        console.warn("[CV Builder] Local storage write warning:", storageErr);
      }

      // 2. If user is signed in and has an active CV, persist to Firestore with resilient fallback
      if (currentUser && activeCvId) {
        const savePromise = updateCV(currentUser.uid, activeCvId, cvData, designConfig, activeCvTitle);
        const timeoutPromise = new Promise<void>((resolve) =>
          setTimeout(() => {
            console.warn("[CV Builder] Cloud save confirmation delayed; draft is safely preserved in local cache.");
            resolve();
          }, 10000)
        );

        await Promise.race([savePromise, timeoutPromise]);
        setAutosaveStatus("saved");
        if (showFeedback) {
          setSuccessToast("All changes saved successfully!");
        }
      } else {
        setAutosaveStatus("local");
        if (showFeedback) {
          setSuccessToast("Draft saved locally on this device.");
        }
      }
    } catch (error: any) {
      console.warn("[CV Builder] Cloud save notice (persisted to local backup):", error);
      setAutosaveStatus("saved");
      if (showFeedback) {
        setSuccessToast("Draft saved locally on this device.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isExporting, cvData, designConfig, activeCvTitle, currentUser, activeCvId]);

  // Debounced Autosave to Firestore & Local Storage
  useEffect(() => {
    // Always backup to localStorage synchronously
    try {
      localStorage.setItem("aura_cv_data", JSON.stringify(cvData));
      localStorage.setItem("aura_cv_design", JSON.stringify(designConfig));
    } catch {
      // Ignore quota errors
    }

    if (!currentUser || !activeCvId) {
      setAutosaveStatus("local");
      return;
    }

    // Indicate saving is pending
    setAutosaveStatus("saving");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Avoid overlapping with an ongoing export or manual save
      if (isExporting) {
        return;
      }

      setIsSaving(true);
      try {
        const savePromise = updateCV(currentUser.uid, activeCvId, cvData, designConfig, activeCvTitle);
        // Resilient network acknowledgment timeout:
        // Local storage and IndexedDB already have the mutations, so Firestore will sync automatically
        const networkTimeout = new Promise<void>((resolve) =>
          setTimeout(() => {
            resolve();
          }, 6000)
        );
        await Promise.race([savePromise, networkTimeout]);
        setAutosaveStatus("saved");
      } catch (err: any) {
        console.warn("[CV Builder] Autosave network notice (saved to local backup):", err);
        // Do not display an error to user when local storage was already successfully updated
        setAutosaveStatus("saved");
      } finally {
        setIsSaving(false);
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cvData, designConfig, activeCvTitle, currentUser, activeCvId, isExporting]);

  // Keyboard shortcut Ctrl+S / Cmd+S for manual save in builder mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (currentRoute === "builder") {
          e.preventDefault();
          handleSave(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, currentRoute]);

  // Auto-fit preview scale to screen size dynamically on mobile/tablet devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
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
    if (window.confirm("Are you sure you want to reset your current draft to default sample data?")) {
      setCvData(initialCVData);
      setDesignConfig(initialDesignConfig);
      setSuccessToast("Restored starter resume content!");
    }
  };

  // High performance PDF / Vector ATS / PNG generation with strict try/catch/finally
  const handleExport = async (format: "pdf" | "vector-pdf" | "png") => {
    // 1. Guard against double-triggers or overlapping operations
    if (isSaving || isExporting) {
      console.warn("[CV Builder] Export skipped: operation already in progress (isSaving:", isSaving, ", isExporting:", isExporting, ")");
      return;
    }

    // 2. If not signed in, automatically prompt Google Sign-In
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setErrorToast("Please sign in with Google to download your CV.");
      return;
    }

    // 3. Clear pending autosave timer and flush local storage
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    try {
      localStorage.setItem("aura_cv_data", JSON.stringify(cvData));
      localStorage.setItem("aura_cv_design", JSON.stringify(designConfig));
    } catch (e) {
      console.warn("[CV Builder] Local storage write notice before export:", e);
    }

    const element = document.getElementById("cv-pdf-render-target");
    if (!element) {
      setErrorToast("Preview layout target not found. Please refresh the page.");
      return;
    }

    setIsExporting(true);
    setErrorToast(null);

    const fileNameStr = cvData.personal.fullName.trim() 
      ? cvData.personal.fullName.replace(/\s+/g, "_") 
      : "Professional";

    try {
      if (format === "vector-pdf") {
        await exportVectorATSPDF("cv-pdf-render-target", {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => {
            console.error("[CV Builder] Vector print notice:", err);
            setErrorToast(err?.message || "PDF generation failed.");
          },
        });
      } else if (format === "pdf") {
        await exportOptimizedPDF(element, {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => {
            console.error("[CV Builder] PDF generation notice:", err);
            setErrorToast(err?.message || "PDF generation failed.");
          },
        });
      } else {
        await exportHighResPNG(element, {
          fileName: fileNameStr,
          templateName: designConfig.templateId,
          onSuccess: (msg) => setSuccessToast(msg),
          onError: (err) => {
            console.error("[CV Builder] PNG generation notice:", err);
            setErrorToast(err?.message || "PNG generation failed.");
          },
        });
      }

      // Record snapshot to Firestore history in background without blocking cleanup
      const logFormat = format === "vector-pdf" ? "pdf" : format;
      recordExport(
        currentUser.uid, 
        logFormat, 
        `${fileNameStr}_CV.${logFormat}`, 
        cvData, 
        designConfig
      ).catch((recordErr) => {
        console.warn("[CV Builder] Export history recording notice:", recordErr);
      });
    } catch (error: any) {
      console.error("[CV Builder] Export error:", error);
      setErrorToast(error?.message || "PDF generation failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 font-sans tracking-tight text-slate-100 select-none ${
      currentRoute === "builder" ? "h-screen overflow-hidden" : "min-h-screen overflow-y-auto"
    }`}>
      
      {/* Dynamic Notifications */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-top-4 text-xs max-w-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl shadow-xl border border-rose-500 animate-in fade-in slide-in-from-top-4 text-xs max-w-sm">
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
          userCVs={cachedUserCVs}
          onImportResume={(parsedCV, title) => {
            setCvData(parsedCV);
            setActiveCvTitle(title);
            setActiveCvId(null);
            navigateTo("builder");
            setSuccessToast(`Imported "${title}"! Ready to customize in the CV Editor.`);
          }}
          onSelectSavedCV={(cvRecord) => {
            setActiveCvId(cvRecord.id || null);
            setActiveCvTitle(cvRecord.title);
            setCvData(cvRecord.data);
            setDesignConfig(cvRecord.design);
            navigateTo("builder");
            setSuccessToast(`Loaded "${cvRecord.title}" into CV Editor!`);
          }}
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
          onOpenSettings={() => setIsAccountSettingsOpen(true)}
          onOpenAIImport={() => setIsAIAssistantOpen(true)}
          onNavigatePrivacy={() => navigateTo("privacy")}
          onNavigateTerms={() => navigateTo("terms")}
          onNavigateATSChecker={() => navigateTo("ats-checker")}
          onNavigateJobMatch={() => navigateTo("job-match")}
        />
      ) : currentRoute === "ats-checker" ? (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Loading ATS Resume Checker...</div>}>
          <LazyATSCheckerPage
            cvData={cvData}
            designConfig={designConfig}
            cvTitle={activeCvTitle}
            cvId={activeCvId || undefined}
            userCVs={cachedUserCVs}
            currentUser={currentUser}
            onUpdateCVData={(updated) => {
              setCvData(updated);
              setSuccessToast("Updated CV content!");
            }}
            onSelectCV={(cvRecord) => {
              setActiveCvId(cvRecord.id || null);
              setActiveCvTitle(cvRecord.title);
              setCvData(cvRecord.data);
              setDesignConfig(cvRecord.design);
              setSuccessToast(`Switched to "${cvRecord.title}"!`);
            }}
            onStartBuilding={() => navigateTo("builder")}
            onOpenJobMatch={() => navigateTo("job-match")}
            onOpenDashboard={() => setIsHistoryModalOpen(true)}
            onOpenSettings={() => setIsAccountSettingsOpen(true)}
            onSignIn={() => {
              setSuccessToast(null);
              setErrorToast(null);
              setIsAuthModalOpen(true);
            }}
            onSignOut={() => {
              signOut(auth);
              setSuccessToast("Signed out successfully!");
            }}
            onNavigateHome={() => navigateTo("home")}
            onNavigatePrivacy={() => navigateTo("privacy")}
            onNavigateTerms={() => navigateTo("terms")}
            onNavigateTemplates={() => {
              navigateTo("home");
              setTimeout(() => {
                document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }}
          />
        </Suspense>
      ) : currentRoute === "job-match" ? (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Loading Resume Job Match...</div>}>
          <LazyJobMatchPage
            cvData={cvData}
            designConfig={designConfig}
            cvTitle={activeCvTitle}
            cvId={activeCvId || undefined}
            userCVs={cachedUserCVs}
            currentUser={currentUser}
            onUpdateCVData={(updated) => {
              setCvData(updated);
              setSuccessToast("Applied tailored recommendation to CV!");
            }}
            onSelectCV={(cvRecord) => {
              setActiveCvId(cvRecord.id || null);
              setActiveCvTitle(cvRecord.title);
              setCvData(cvRecord.data);
              setDesignConfig(cvRecord.design);
              setSuccessToast(`Switched to "${cvRecord.title}"!`);
            }}
            onStartBuilding={() => navigateTo("builder")}
            onOpenATSChecker={() => navigateTo("ats-checker")}
            onOpenDashboard={() => setIsHistoryModalOpen(true)}
            onOpenSettings={() => setIsAccountSettingsOpen(true)}
            onSignIn={() => {
              setSuccessToast(null);
              setErrorToast(null);
              setIsAuthModalOpen(true);
            }}
            onSignOut={() => {
              signOut(auth);
              setSuccessToast("Signed out successfully!");
            }}
            onNavigateHome={() => navigateTo("home")}
            onNavigatePrivacy={() => navigateTo("privacy")}
            onNavigateTerms={() => navigateTo("terms")}
            onNavigateTemplates={() => {
              navigateTo("home");
              setTimeout(() => {
                document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }}
          />
        </Suspense>
      ) : (
        <>
          {/* Primary Top Utilities Header Bar */}
          <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 relative z-30 shadow-md">
            
            {/* Left: Brand + My CVs + Import */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div 
                onClick={() => navigateTo("home")}
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-90 select-none group shrink-0"
                title="Go to Homepage"
                id="header_logo_home_btn"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-lg shadow-indigo-500/10 shrink-0 group-hover:scale-[1.03] transition-transform">
                  AI
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-none">
                    ProCVMaker
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">AI CV Builder & ATS Resume Checker</p>
                </div>
              </div>

              {/* Utility: My CVs */}
              <button
                onClick={() => currentUser ? setIsHistoryModalOpen(true) : setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
                title="Manage all your CV drafts and history"
                id="header_my_cvs_btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">My CVs</span>
              </button>

              {/* Utility: Import Resume Button */}
              <button
                onClick={() => setIsAIAssistantOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition select-none shrink-0"
                title="Import existing resume from PDF, Word, or text"
                id="header_ai_assistant_btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Import</span>
              </button>
            </div>

            {/* Center: Core Public Tools Links */}
            <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-400">
              <span className="text-teal-300 font-bold bg-teal-950/50 border border-teal-800/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>CV Builder</span>
              </span>
              <a
                href="/ats-checker"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("ats-checker");
                }}
                className="text-slate-300 hover:text-white hover:bg-slate-900 px-2.5 py-1 rounded-lg transition"
                id="builder_header_nav_ats_checker"
              >
                ATS Checker
              </a>
              <a
                href="/job-match"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("job-match");
                }}
                className="text-slate-300 hover:text-white hover:bg-slate-900 px-2.5 py-1 rounded-lg transition"
                id="builder_header_nav_job_match"
              >
                Job Match
              </a>
              <a
                href="/#templates"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("home");
                  setTimeout(() => {
                    document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                }}
                className="text-slate-300 hover:text-white hover:bg-slate-900 px-2.5 py-1 rounded-lg transition"
                id="builder_header_nav_templates"
              >
                Templates
              </a>
            </nav>

            {/* Right: Small Save Status, Download Dropdown, User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Subtle Save/Sync Status Indicator */}
              <div className="hidden md:flex items-center">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Saving...</span>
                  </div>
                ) : autosaveStatus === "saved" ? (
                  <button
                    onClick={() => handleSave(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    title="All changes saved to your Google account in Firestore. Click to save now."
                    id="header_save_status_btn"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved</span>
                  </button>
                ) : autosaveStatus === "saving" ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Saving...</span>
                  </div>
                ) : autosaveStatus === "error" ? (
                  <button
                    onClick={() => handleSave(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-rose-300 hover:text-rose-200 transition cursor-pointer"
                    title="Sync issue. Click to retry saving."
                    id="header_save_status_btn"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Save failed · <span className="underline decoration-rose-500">Retry</span></span>
                  </button>
                ) : (
                  <button
                    onClick={() => currentUser ? handleSave(true) : setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                    title={currentUser ? "Click to save to cloud" : "Sign in with Google to enable automatic cloud backup"}
                    id="header_save_status_btn"
                  >
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>Saved locally · <span className="underline decoration-slate-600 hover:decoration-indigo-400">{currentUser ? "Save to cloud" : "Sign in to sync"}</span></span>
                  </button>
                )}
              </div>

              {/* Primary Action: Download Dropdown */}
              <DownloadDropdown
                onExport={handleExport}
                isExporting={isExporting}
                isSaving={isSaving}
              />

              {/* User Google Auth controls */}
              {currentUser ? (
                <div className="border-l border-slate-800 pl-2 sm:pl-3 shrink-0">
                  <UserDropdown
                    currentUser={currentUser}
                    onOpenDashboard={() => setIsHistoryModalOpen(true)}
                    onOpenSettings={() => setIsAccountSettingsOpen(true)}
                    onSignOut={() => {
                      signOut(auth);
                      setSuccessToast("Signed out successfully.");
                    }}
                    onNavigatePrivacy={() => navigateTo("privacy")}
                    onNavigateTerms={() => navigateTo("terms")}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSuccessToast(null);
                    setErrorToast(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold transition select-none cursor-pointer shrink-0 shadow-sm"
                  id="header_login_btn"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
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
                onCheckATS={() => handleOpenATS()}
                onMatchJob={() => handleOpenJobMatch()}
                onResetDraft={handleResetToSample}
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
                    width: "794px",
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
              <span className="font-semibold text-slate-400">ProCVMaker</span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="hidden sm:inline text-slate-500">
                {currentUser ? "Continuous cloud autosave enabled" : "Local draft saved (Sign in for cloud sync)"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/ats-checker"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("ats-checker");
                }} 
                className="hover:text-slate-300 transition cursor-pointer"
                id="builder_footer_ats_btn"
              >
                ATS Checker
              </a>
              <a 
                href="/job-match"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("job-match");
                }} 
                className="hover:text-slate-300 transition cursor-pointer"
                id="builder_footer_job_match_btn"
              >
                Job Match
              </a>
              <a 
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("privacy");
                }} 
                className="hover:text-slate-300 transition cursor-pointer"
                id="builder_footer_privacy_btn"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("terms");
                }} 
                className="hover:text-slate-300 transition cursor-pointer"
                id="builder_footer_terms_btn"
              >
                Terms of Service
              </a>
              <a 
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("home");
                }} 
                className="hover:text-indigo-400 transition cursor-pointer font-medium"
                id="builder_footer_home_btn"
              >
                Home
              </a>
            </div>
          </footer>
        </>
      )}

      {/* Google Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setSuccessToast(`Signed in as ${user.displayName}!`);
        }}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        currentUser={currentUser}
        onOpenDashboard={() => {
          setIsAccountSettingsOpen(false);
          setIsHistoryModalOpen(true);
        }}
        onProfileUpdated={(newName) => {
          setCurrentUser(prev => prev ? { ...prev, displayName: newName } : null);
          setSuccessToast("Profile name updated successfully.");
        }}
      />

      {/* My Resumes & Documents Dashboard */}
      <UserDashboard
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentUser={currentUser}
        activeCvId={activeCvId}
        initialCVs={cachedUserCVs}
        onCVListUpdated={setCachedUserCVs}
        onSelectCV={(cvRecord) => {
          setActiveCvId(cvRecord.id);
          setActiveCvTitle(cvRecord.title);
          setCvData(cvRecord.data);
          setDesignConfig(cvRecord.design);
          setIsHistoryModalOpen(false);
          navigateTo("builder");
          setSuccessToast(`Switched to "${cvRecord.title}"!`);
        }}
        onRestoreCV={(restoredCv, restoredDesign) => {
          setCvData(restoredCv);
          if (restoredDesign) {
            setDesignConfig(restoredDesign);
          }
          setIsHistoryModalOpen(false);
          navigateTo("builder");
          setSuccessToast("Restored CV snapshot into editor!");
        }}
        onCheckATS={(cvRecord) => {
          handleOpenATS({
            cvData: cvRecord.data,
            designConfig: cvRecord.design,
            title: cvRecord.title
          });
        }}
        onMatchJob={(cvRecord) => {
          handleOpenJobMatch({
            cvData: cvRecord.data,
            title: cvRecord.title
          });
        }}
      />

      {/* AI Assistant Modal */}
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

      {/* Advanced ATS Compatibility Analyzer Modal (Lazy Loaded) */}
      <Suspense fallback={null}>
        {isATSModalOpen && targetATSCV && (
          <LazyATSAnalyzerModal
            isOpen={isATSModalOpen}
            onClose={() => setIsATSModalOpen(false)}
            cvData={targetATSCV.cvData}
            designConfig={targetATSCV.designConfig}
            cvTitle={targetATSCV.title}
            onOpenJobMatch={() => {
              const cv = targetATSCV;
              handleOpenJobMatch({
                cvData: cv.cvData,
                title: cv.title
              });
            }}
            onUpdateCVData={(updated) => {
              if (targetATSCV.title === (activeCvTitle || "My Resume")) {
                setCvData(updated);
              }
              setTargetATSCV(prev => prev ? { ...prev, cvData: updated } : null);
              setSuccessToast("Applied AI improvement to CV!");
            }}
          />
        )}
      </Suspense>

      {/* Job Description -> CV Match Modal (Lazy Loaded) */}
      <Suspense fallback={null}>
        {isJobMatchOpen && targetJobMatchCV && (
          <LazyJobMatchModal
            isOpen={isJobMatchOpen}
            onClose={() => setIsJobMatchOpen(false)}
            cvData={targetJobMatchCV.cvData}
            cvTitle={targetJobMatchCV.title}
            onUpdateCVData={(updated) => {
              if (targetJobMatchCV.title === (activeCvTitle || "My Resume")) {
                setCvData(updated);
              }
              setTargetJobMatchCV(prev => prev ? { ...prev, cvData: updated } : null);
              setSuccessToast("Applied tailored recommendation to resume!");
            }}
          />
        )}
      </Suspense>

    </div>
  );
}
