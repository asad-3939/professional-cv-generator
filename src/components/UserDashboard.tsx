import React, { useEffect, useState, lazy, Suspense } from "react";
import { 
  X as XIcon, History as HistoryIcon, Calendar as CalendarIcon, FileText as FileTextIcon, 
  Download as DownloadIcon, Sparkles as SparklesIcon, Loader2 as Loader2Icon, 
  RefreshCw as RefreshCwIcon, Layers as LayersIcon, Check as CheckIcon, Eye as EyeIcon, 
  LayoutDashboard as LayoutDashboardIcon, Cloud as CloudIcon, ArrowRight as ArrowRightIcon, 
  Trash2 as Trash2Icon, FileImage as FileImageIcon, Plus as PlusIcon, Copy as CopyIcon,
  Edit2 as Edit2Icon, CheckCircle2 as CheckCircle2Icon, ShieldCheck as ShieldCheckIcon,
  Target as TargetIcon
} from "lucide-react";
import { CVData, DesignConfig, CVRecord, TemplateId } from "../types";
import { 
  getUserCVs, 
  createCV, 
  deleteCV, 
  duplicateCV, 
  renameCV 
} from "../lib/cvService";
import { initialCVData, initialDesignConfig } from "../sampleData";
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Lazy-load full ResumeTemplates component only for lightbox preview/restore
const LazyResumeTemplates = lazy(() => 
  import("./ResumeTemplates").then(m => ({ default: m.ResumeTemplates }))
);

interface AIDownloadRecord {
  id?: string;
  timestamp: string;
  format: "pdf" | "png";
  fileName: string;
  cvData?: CVData;
  designConfig?: DesignConfig;
}

interface AIGenerationRecord {
  timestamp: string;
  type: string;
  description: string;
  details?: string;
}

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; displayName: string; uid: string } | null;
  activeCvId?: string | null;
  initialCVs?: CVRecord[];
  onSelectCV: (cvRecord: CVRecord) => void;
  onRestoreCV: (cvData: CVData, designConfig?: DesignConfig) => void;
  onCreateNew?: () => void;
  onCVListUpdated?: (cvs: CVRecord[]) => void;
  onCheckATS?: (cvRecord: CVRecord) => void;
  onMatchJob?: (cvRecord: CVRecord) => void;
}

const fallbackDesignConfig: DesignConfig = {
  templateId: "modern",
  themeColor: "#4f46e5",
  spacing: "normal",
  fontFamily: "sans",
  showExperienceSection: true,
  showEducationSection: true,
  showProjectsSection: true,
  showCertificationsSection: true,
  showLanguagesSection: true
};

export function UserDashboard({ 
  isOpen, 
  onClose, 
  currentUser, 
  activeCvId,
  initialCVs = [],
  onSelectCV,
  onRestoreCV,
  onCreateNew,
  onCVListUpdated,
  onCheckATS,
  onMatchJob
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"resumes" | "exports" | "ai">("resumes");
  const [cvsList, setCvsList] = useState<CVRecord[]>(initialCVs);
  const [downloadsCount, setDownloadsCount] = useState<number>(0);
  const [downloadsList, setDownloadsList] = useState<AIDownloadRecord[]>([]);
  const [aiGenerationsList, setAiGenerationsList] = useState<AIGenerationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(initialCVs.length === 0);
  const [exportsLoading, setExportsLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Inline rename state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>("");

  // Create new CV modal inside dashboard
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newCVTitle, setNewCVTitle] = useState<string>("");
  const [newCVTemplate, setNewCVTemplate] = useState<TemplateId>("modern");

  // State for opening/viewing a file snapshot inside the dashboard
  const [previewFile, setPreviewFile] = useState<AIDownloadRecord | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(0.6);

  // Sync initial CVs when provided by parent
  useEffect(() => {
    if (initialCVs && initialCVs.length > 0) {
      setCvsList(initialCVs);
      setLoading(false);
    }
  }, [initialCVs]);

  // Fast targeted fetch for CVs collection
  const loadUserCVs = async () => {
    if (!currentUser) return;
    if (cvsList.length === 0) {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      const cvs = await getUserCVs(currentUser.uid, 20);
      setCvsList(cvs);
      if (onCVListUpdated) {
        onCVListUpdated(cvs);
      }
    } catch (err: any) {
      console.error("Dashboard CV load error:", err);
      setErrorMsg("Could not refresh resumes list. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Background non-blocking fetch for user stats
  const loadUserStats = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const d = userSnap.data();
        setDownloadsCount(d.downloadsCount || 0);
        if (d.aiGenerations) {
          setAiGenerationsList(d.aiGenerations);
        }
      }
    } catch (e) {
      console.warn("User stats fetch notice:", e);
    }
  };

  // On-demand fetch for exports history
  const loadExportsHistory = async () => {
    if (!currentUser || downloadsList.length > 0) return;
    setExportsLoading(true);
    try {
      const historyRef = collection(db, "users", currentUser.uid, "history");
      const q = query(historyRef, orderBy("timestamp", "desc"), limit(25));
      const historySnap = await getDocs(q);
      const historyItems: AIDownloadRecord[] = [];
      historySnap.forEach((docSnap) => {
        const d = docSnap.data();
        historyItems.push({
          id: docSnap.id,
          timestamp: d.timestamp || new Date().toISOString(),
          format: d.format || "pdf",
          fileName: d.fileName || "Resume_Export",
          cvData: d.cvData,
          designConfig: d.designConfig
        });
      });
      setDownloadsList(historyItems);
    } catch (e) {
      console.warn("Exports history fetch notice:", e);
    } finally {
      setExportsLoading(false);
    }
  };

  // Trigger fast CV loading when dashboard opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadUserCVs();
      loadUserStats();
    }
  }, [isOpen, currentUser]);

  // Trigger exports history ONLY when user navigates to exports tab
  useEffect(() => {
    if (isOpen && currentUser && activeTab === "exports") {
      loadExportsHistory();
    }
  }, [isOpen, currentUser, activeTab]);

  // Handle Delete CV
  const handleDeleteCV = async (cvId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (cvsList.length <= 1) {
      if (!window.confirm("This is your only resume. Deleting it will create a fresh blank resume. Continue?")) {
        return;
      }
    } else {
      if (!window.confirm("Are you sure you want to permanently delete this resume?")) {
        return;
      }
    }

    setActionLoadingId(cvId);
    try {
      await deleteCV(currentUser.uid, cvId);
      const updated = cvsList.filter(c => c.id !== cvId);
      setCvsList(updated);

      // If the deleted CV was currently open in the workspace, open the next available one
      if (activeCvId === cvId && updated.length > 0) {
        onSelectCV(updated[0]);
      } else if (updated.length === 0) {
        // Create fresh CV
        const fresh = await createCV(currentUser.uid, initialCVData, initialDesignConfig, "My Resume", true);
        setCvsList([fresh]);
        onSelectCV(fresh);
      }
    } catch (err) {
      console.error("Failed to delete CV:", err);
      setErrorMsg("Failed to delete resume. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Duplicate CV
  const handleDuplicateCV = async (cv: CVRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    setActionLoadingId(cv.id);
    try {
      const duplicated = await duplicateCV(currentUser.uid, cv);
      setCvsList(prev => [duplicated, ...prev]);
    } catch (err) {
      console.error("Failed to duplicate CV:", err);
      setErrorMsg("Failed to duplicate resume.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Rename Submit
  const handleRenameSubmit = async (cvId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingTitleText.trim()) {
      setEditingTitleId(null);
      return;
    }

    setActionLoadingId(cvId);
    try {
      const title = editingTitleText.trim();
      await renameCV(currentUser.uid, cvId, title);
      setCvsList(prev => prev.map(c => c.id === cvId ? { ...c, title } : c));
      setEditingTitleId(null);
    } catch (err) {
      console.error("Failed to rename CV:", err);
      setErrorMsg("Failed to rename resume.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Create New CV Submit
  const handleCreateNewCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const title = newCVTitle.trim() || "New Professional Resume";
      const config: DesignConfig = {
        ...initialDesignConfig,
        templateId: newCVTemplate
      };

      const created = await createCV(currentUser.uid, initialCVData, config, title, false);
      setCvsList(prev => [created, ...prev]);
      setIsCreatingNew(false);
      setNewCVTitle("");
      onSelectCV(created);
      onClose();
    } catch (err) {
      console.error("Failed to create new CV:", err);
      setErrorMsg("Failed to create new resume.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete History Item
  const handleDeleteHistory = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm("Delete this export snapshot?")) return;

    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "history", itemId));
      setDownloadsList(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Error removing export record:", err);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="dashboard-overlay" onClick={onClose}>
      
      {/* Lightbox File Preview Overlay Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-50 p-4 md:p-8 flex flex-col justify-between" 
          id="file-lightbox-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Info Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-xl ${
                previewFile.format === "pdf" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
              }`}>
                {previewFile.format === "pdf" ? <FileTextIcon className="w-5 h-5" /> : <FileImageIcon className="w-5 h-5" />}
              </span>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{previewFile.fileName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400 uppercase">
                    {previewFile.format.toUpperCase()} Preview
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Saved on: <span className="font-mono text-indigo-400">{new Date(previewFile.timestamp).toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Quick Scaling and Close panel */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white font-black cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-300 w-12 text-center select-none">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button 
                  onClick={() => setPreviewZoom(z => Math.min(1.2, z + 0.1))}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white font-black cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <button 
                onClick={() => setPreviewFile(null)}
                className="p-2 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 rounded-xl transition cursor-pointer"
                title="Return to list"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core Body */}
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden py-6 gap-6">
            <div className="w-full lg:w-[30%] shrink-0 flex flex-col justify-between overflow-y-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 gap-6 text-left">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block mb-1">Resume Snapshot</span>
                <h4 className="text-lg font-extrabold text-white leading-tight">
                  {previewFile.cvData?.personal?.fullName || "Untitled Profile"}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {previewFile.cvData?.personal?.jobTitle || "No title specified"}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    onRestoreCV(previewFile.cvData!, previewFile.designConfig || fallbackDesignConfig);
                    setPreviewFile(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>Restore & Edit This Version</span>
                </button>
                
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Back to List
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-grow bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-center p-4 overflow-y-auto relative">
              <div 
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: "top center",
                  width: "794px",
                }}
                className="bg-white text-slate-900 shadow-2xl p-8 rounded-lg min-h-[1123px] text-left transition-transform duration-200"
              >
                {previewFile.cvData && (
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-12 text-slate-400">
                      <Loader2Icon className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  }>
                    <LazyResumeTemplates 
                      data={previewFile.cvData} 
                      design={previewFile.designConfig || fallbackDesignConfig} 
                    />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Dialog */}
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[640px] max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
        id="dashboard-container"
      >
        {/* Header Decorator gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-400" />

        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <LayoutDashboardIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight" id="dashboard-title">
                My CVs & Documents
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Account: <span className="text-indigo-400 font-medium">{currentUser.email}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            id="close-dashboard-btn"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Bento Stats Summary Bar */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/60 grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">My Resumes</span>
              <span className="text-lg font-extrabold text-white">{cvsList.length}</span>
            </div>
            <FileTextIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PDF Downloads</span>
              <span className="text-lg font-extrabold text-teal-400">{downloadsCount}</span>
            </div>
            <DownloadIcon className="w-4 h-4 text-teal-400 shrink-0" />
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cloud Sync</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CloudIcon className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-900">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("resumes")}
              className={`py-3 text-xs font-semibold relative transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "resumes" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-resumes"
            >
              <FileTextIcon className="w-3.5 h-3.5" />
              <span>My Resumes ({cvsList.length})</span>
              {activeTab === "resumes" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("exports")}
              className={`py-3 text-xs font-semibold relative transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "exports" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-downloads-history"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Export History ({downloadsList.length})</span>
              {activeTab === "exports" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`py-3 text-xs font-semibold relative transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-ai-history"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Logs ({aiGenerationsList.length})</span>
              {activeTab === "ai" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "resumes" && (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                id="create-new-cv-btn"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>New Resume</span>
              </button>
            )}

            <button
              onClick={() => {
                loadUserCVs();
                loadUserStats();
                if (activeTab === "exports") loadExportsHistory();
              }}
              disabled={loading}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Refresh"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-900/60 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-300 text-xs rounded-xl flex items-center gap-2 mb-4">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* New Resume Quick Creator Dialog */}
          {isCreatingNew && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create New Resume</h3>
                </div>
                <button 
                  onClick={() => setIsCreatingNew(false)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewCV} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resume Title / Target Role
                  </label>
                  <input 
                    type="text"
                    required
                    value={newCVTitle}
                    onChange={(e) => setNewCVTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer, Executive Resume"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Template Layout
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["modern", "minimalist", "executive", "creative"] as TemplateId[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewCVTemplate(t)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer capitalize ${
                          newCVTemplate === t
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Create & Open Resume
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && cvsList.length === 0 ? (
            <div className="space-y-3" id="cvs-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded-md w-1/3" />
                    <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 bg-slate-800 rounded-xl w-24" />
                    <div className="h-8 bg-slate-800/60 rounded-xl w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "resumes" ? (
            /* Resumes Tab */
            cvsList.length === 0 ? (
              <div className="text-center py-14 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <FileTextIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No resumes created yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Create your first resume to start editing and automatically syncing to your cloud account.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create First Resume</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3" id="cvs-list">
                {cvsList.map((cv) => {
                  const isActive = activeCvId === cv.id;
                  const isRenaming = editingTitleId === cv.id;
                  const formattedDate = cv.updatedAt 
                    ? new Date(cv.updatedAt?.toDate ? cv.updatedAt.toDate() : cv.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "Recently";

                  return (
                    <div
                      key={cv.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActive
                          ? "bg-slate-950 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <form onSubmit={(e) => handleRenameSubmit(cv.id, e)} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              className="px-2.5 py-1 bg-slate-900 border border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                              title="Save Title"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTitleId(null)}
                              className="p-1 text-slate-500 hover:text-slate-300"
                              title="Cancel"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{cv.title}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(cv.id);
                                setEditingTitleText(cv.title);
                              }}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                              title="Rename resume"
                            >
                              <Edit2Icon className="w-3 h-3" />
                            </button>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded text-[9px] font-black uppercase tracking-wider">
                                Active in Editor
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span>Target: <strong className="text-slate-300 font-medium">{cv.data?.personal?.jobTitle || "Not set"}</strong></span>
                          <span>•</span>
                          <span className="capitalize">Template: <strong className="text-slate-300 font-medium">{cv.design?.templateId || "Modern"}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-slate-500 text-[10px]">Updated: {formattedDate}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        {actionLoadingId === cv.id ? (
                          <Loader2Icon className="w-4 h-4 animate-spin text-indigo-400 p-1" />
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                onSelectCV(cv);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                              }`}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              <span>{isActive ? "Continue Editing" : "Open Resume"}</span>
                            </button>

                            {onCheckATS && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCheckATS(cv);
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-teal-300 border border-slate-800 hover:border-teal-700/50 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                                title="Run Advanced ATS Analysis on this resume"
                              >
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-400" />
                                <span className="hidden md:inline">Check ATS</span>
                              </button>
                            )}

                            {onMatchJob && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMatchJob(cv);
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-teal-300 border border-slate-800 hover:border-teal-700/50 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                                title="Compare this resume against a target job description"
                              >
                                <TargetIcon className="w-3.5 h-3.5 text-teal-400" />
                                <span className="hidden md:inline">Match Job</span>
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDuplicateCV(cv, e)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                              title="Duplicate Resume"
                            >
                              <CopyIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleDeleteCV(cv.id, e)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                              title="Delete Resume"
                            >
                              <Trash2Icon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === "exports" ? (
            /* Exports Tab */
            exportsLoading && downloadsList.length === 0 ? (
              <div className="space-y-3" id="exports-skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-800 rounded w-1/3" />
                        <div className="h-2.5 bg-slate-800/60 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-7 bg-slate-800 rounded-xl w-24" />
                  </div>
                ))}
              </div>
            ) : downloadsList.length === 0 ? (
              <div className="text-center py-14 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <DownloadIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No export snapshots yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Exporting your resume to PDF or PNG automatically creates snapshots here that you can preview and restore anytime.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3" id="downloads-list">
                {downloadsList.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-950/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        item.format === "pdf" ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        <FileTextIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate">{item.fileName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                        {item.cvData?.personal?.fullName && (
                          <p className="text-[11px] text-indigo-400 font-medium truncate mt-0.5">
                            Name: <span className="text-slate-300">{item.cvData.personal.fullName}</span> {item.cvData.personal.jobTitle ? `(${item.cvData.personal.jobTitle})` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        item.format === "pdf" 
                          ? "bg-rose-950/50 text-rose-400 border border-rose-900/30" 
                          : "bg-blue-950/50 text-blue-400 border border-blue-900/30"
                      }`}>
                        {item.format}
                      </span>

                      {item.cvData && (
                        <button
                          onClick={() => setPreviewFile(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Preview and restore snapshot"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>View & Restore</span>
                        </button>
                      )}

                      {item.id && (
                        <button
                          onClick={(e) => handleDeleteHistory(item.id!, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* AI Logs Tab */
            aiGenerationsList.length === 0 ? (
              <div className="text-center py-14 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <SparklesIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No AI enhancements logged yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Use the AI summary generator or bullet point polisher inside the CV editor to automatically log improvements here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3" id="ai-generations-list">
                {aiGenerationsList.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:bg-slate-950/70 transition flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 shrink-0 mt-0.5">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{item.type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300 mt-1 font-medium">{item.description}</p>
                      {item.details && (
                        <div className="mt-2 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/40">
                          <p className="text-[11px] text-slate-400 leading-relaxed italic text-left">
                            "{item.details}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted cloud storage active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
