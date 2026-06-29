import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, query, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CVData, DesignConfig } from "../types";
import { ResumeTemplates } from "./ResumeTemplates";

// Safe import of icons from lucide-react instead of firebase/firestore
import { 
  X as XIcon, History as HistoryIcon, Calendar as CalendarIcon, FileText as FileTextIcon, 
  Download as DownloadIcon, Sparkles as SparklesIcon, Loader2 as Loader2Icon, 
  RefreshCw as RefreshCwIcon, Layers as LayersIcon, Check as CheckIcon, Eye as EyeIcon, 
  HelpCircle as HelpCircleIcon, LayoutDashboard as LayoutDashboardIcon, 
  Database as DatabaseIcon, ArrowRight as ArrowRightIcon, Trash2 as Trash2Icon,
  FileImage as FileImageIcon, Printer as PrinterIcon, Monitor as MonitorIcon
} from "lucide-react";

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
  onRestoreCV: (cvData: CVData, designConfig?: DesignConfig) => void;
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

export function UserDashboard({ isOpen, onClose, currentUser, onRestoreCV }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "downloads">("downloads");
  const [downloadsCount, setDownloadsCount] = useState<number>(0);
  const [downloadsList, setDownloadsList] = useState<AIDownloadRecord[]>([]);
  const [aiGenerationsList, setAiGenerationsList] = useState<AIGenerationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for opening/viewing a file snapshot inside the dashboard
  const [previewFile, setPreviewFile] = useState<AIDownloadRecord | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(0.6);

  const fetchUserData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let rootCvData: CVData | undefined = undefined;
      let mainDocDownloads: AIDownloadRecord[] = [];
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDownloadsCount(data.downloadsCount || 0);
        rootCvData = data.cvData;
        mainDocDownloads = data.downloads || [];

        const gens: AIGenerationRecord[] = data.aiGenerations || [];
        const sortedGens = [...gens].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAiGenerationsList(sortedGens);
      } else {
        setDownloadsCount(0);
        setAiGenerationsList([]);
      }

      let subDocDownloads: AIDownloadRecord[] = [];
      try {
        const historyRef = collection(db, "users", currentUser.uid, "history");
        const q = query(historyRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          subDocDownloads.push({
            id: docSnap.id,
            timestamp: d.timestamp || new Date().toISOString(),
            format: d.format || "pdf",
            fileName: d.fileName || "CV_Resume",
            cvData: d.cvData,
            designConfig: d.designConfig
          });
        });
      } catch (histErr) {
        console.error("Error fetching history subcollection:", histErr);
      }

      // Merge both sources of downloads uniquely
      const mergedMap = new Map<string, AIDownloadRecord>();

      subDocDownloads.forEach((subItem) => {
        const key = subItem.timestamp + "_" + subItem.fileName;
        mergedMap.set(key, subItem);
      });

      mainDocDownloads.forEach((mainItem) => {
        const alreadyExists = subDocDownloads.some((subItem) => {
          const timeDiff = Math.abs(new Date(subItem.timestamp).getTime() - new Date(mainItem.timestamp).getTime());
          return timeDiff < 15000 || subItem.fileName === mainItem.fileName;
        });

        if (!alreadyExists) {
          const key = mainItem.timestamp + "_" + mainItem.fileName;
          mergedMap.set(key, {
            ...mainItem,
            cvData: mainItem.cvData || rootCvData
          });
        }
      });

      const sortedMerged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setDownloadsList(sortedMerged);
    } catch (err: any) {
      console.error("Error fetching user dashboard data:", err);
      setErrorMsg("Failed to synchronize dashboard stats. Check network connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserData();
    }
  }, [isOpen, currentUser]);

  const handleDeleteHistory = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this historical download snapshot?")) return;

    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "history", itemId));
      setDownloadsList((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error deleting history record:", err);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="dashboard-overlay">
      
      {/* Lightbox File Preview Overlay Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-50 p-4 md:p-8 flex flex-col justify-between" id="file-lightbox-modal">
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
                    Snapshot {previewFile.format}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Archived on: <span className="font-mono text-indigo-400">{new Date(previewFile.timestamp).toLocaleString()}</span>
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
                title="Return to Dashboard list"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core Body: Left Info / Right Interactive Canvas Preview */}
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden py-6 gap-6">
            
            {/* Left Column: Metadata & Detailed Overview */}
            <div className="w-full lg:w-[30%] shrink-0 flex flex-col justify-between overflow-y-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 gap-6 text-left">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block mb-1">Document Profile Snapshot</span>
                <h4 className="text-lg font-extrabold text-white leading-tight">
                  {previewFile.cvData?.personal?.fullName || "Untitled Profile"}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {previewFile.cvData?.personal?.jobTitle || "No title specified"}
                </p>

                {previewFile.cvData?.personal?.email && (
                  <div className="mt-4 space-y-2 text-xs border-t border-slate-800/60 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[180px]">{previewFile.cvData.personal.email}</span>
                    </div>
                    {previewFile.cvData.personal.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-300 font-medium">{previewFile.cvData.personal.phone}</span>
                      </div>
                    )}
                    {previewFile.cvData.personal.location && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-slate-300 font-medium">{previewFile.cvData.personal.location}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Profile Attributes */}
                <div className="mt-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 text-xs space-y-3">
                  <h5 className="font-bold text-slate-400 text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                    <LayersIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Applied Design Settings</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
                    <div>Spacing: <span className="text-white capitalize">{previewFile.designConfig?.spacing || "normal"}</span></div>
                    <div>Font: <span className="text-white capitalize">{previewFile.designConfig?.fontFamily || "sans"}</span></div>
                    <div>Layout: <span className="text-white capitalize">{previewFile.designConfig?.layoutStructure || "standard"}</span></div>
                    <div>Text Size: <span className="text-white capitalize">{previewFile.designConfig?.fontSize || "sm"}</span></div>
                  </div>
                </div>

                {/* Summary Section snippet */}
                {previewFile.cvData?.summary && (
                  <div className="mt-6">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1.5">Profile Summary Snippet</span>
                    <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/20 p-3 rounded-lg border border-slate-800/30">
                      "{previewFile.cvData.summary.substring(0, 160)}..."
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for this file */}
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

            {/* Right Column: High-fidelity rendered canvas simulation */}
            <div className="flex-grow bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-center p-4 overflow-y-auto relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]">
              <div 
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: "top center",
                  width: "794px", // Matches fixed A4 sheet width
                }}
                className="bg-white text-slate-900 shadow-2xl p-8 rounded-lg min-h-[1123px] text-left transition-transform duration-200"
              >
                {previewFile.cvData && (
                  <ResumeTemplates 
                    data={previewFile.cvData} 
                    design={previewFile.designConfig || fallbackDesignConfig} 
                  />
                )}
              </div>
            </div>

          </div>

          {/* Bottom Status bar */}
          <div className="border-t border-slate-800 pt-4 shrink-0 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Live Preview Rendering Engine • PDF Resolution Equivalent: 240 DPI
            </p>
          </div>
        </div>
      )}

      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="dashboard-container"
      >
        {/* Header Decorator gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-400" />

        {/* Top Header Panel */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <LayoutDashboardIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight" id="dashboard-title">
                My Dashboard & CV History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time activity logs synced to <span className="font-mono text-indigo-400">{currentUser.email}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            id="close-dashboard-btn"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Bento Stats Section */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800/50 grid grid-cols-3 gap-4 shrink-0">
          <div className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Downloads</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white" id="dashboard-stat-downloads">{downloadsCount}</span>
              <span className="text-[10px] font-semibold text-indigo-400">times</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Profiles Run</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-400" id="dashboard-stat-ai">{aiGenerationsList.length}</span>
              <span className="text-[10px] font-semibold text-slate-400">events</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storage Status</span>
            <div className="flex items-baseline gap-1 mt-1">
              <DatabaseIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">Firestore Cloud</span>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs Navigation */}
        <div className="px-6 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-900">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("downloads")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider relative transition cursor-pointer ${
                activeTab === "downloads" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-downloads-history"
            >
              Downloads List ({downloadsList.length})
              {activeTab === "downloads" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider relative transition cursor-pointer ${
                activeTab === "ai" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-ai-history"
            >
              AI Generations ({aiGenerationsList.length})
              {activeTab === "ai" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>

          <button
            onClick={fetchUserData}
            disabled={loading}
            className="text-slate-400 hover:text-white transition flex items-center gap-1.5 text-[10px] font-mono tracking-wider cursor-pointer"
            id="refresh-dashboard-btn"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Sync Live</span>
          </button>
        </div>

        {/* Scrollable Tab Content Panels */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-900/60 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-300 text-xs rounded-xl flex items-center gap-2 mb-4 animate-pulse">
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2Icon className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400 font-mono">Synchronizing from Firebase Firestore...</p>
            </div>
          ) : activeTab === "ai" ? (
            /* AI Generations Tab Content */
            aiGenerationsList.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mx-auto border border-slate-800 text-slate-600">
                  <SparklesIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No AI-generated profiles recorded yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Trigger any AI feature inside the CV form builder, such as generating automated summaries, polishing experiences, or suggesting dynamic skills to see them tracked here!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="ai-generations-list">
                {aiGenerationsList.map((item, idx) => {
                  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/75 transition flex items-start gap-3.5 relative"
                    >
                      <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 shrink-0 mt-0.5">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{item.type}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 text-slate-600" />
                            {formattedDate}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300 mt-1 font-medium">{item.description}</p>
                        {item.details && (
                          <div className="mt-2 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/40">
                            <p className="text-[11px] text-slate-400 font-mono leading-relaxed break-words italic text-left">
                              "{item.details}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Downloads List Tab Content */
            downloadsList.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mx-auto border border-slate-800 text-slate-600">
                  <DownloadIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No downloads performed yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Once you download your CV as a PDF document or a PNG layout image, your operations will be tracked right here!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5" id="downloads-list">
                <div className="text-left text-[11px] text-slate-400 font-medium px-1 pb-1">
                  Click <strong className="text-indigo-400">Open File</strong> next to any past download to instantly load and view that specific PDF/PNG version in the editor.
                </div>
                {downloadsList.map((item, idx) => {
                  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div 
                      key={item.id || idx}
                      className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-950/75 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          item.format === "pdf" 
                            ? "bg-red-500/10 text-red-400" 
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          <FileTextIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-white truncate">{item.fileName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formattedDate}</p>
                          {item.cvData?.personal?.fullName && (
                            <p className="text-[11px] text-indigo-400 font-medium truncate mt-1">
                              Snapshot: <span className="text-slate-300">{item.cvData.personal.fullName}</span> {item.cvData.personal.jobTitle ? `(${item.cvData.personal.jobTitle})` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          item.format === "pdf" 
                            ? "bg-red-950/50 text-red-400 border border-red-900/30" 
                            : "bg-blue-950/50 text-blue-400 border border-blue-900/30"
                        }`}>
                          {item.format}
                        </span>

                        {item.cvData && (
                          <button
                            onClick={() => setPreviewFile(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer hover:scale-[1.01]"
                            title="Open and view this PDF/PNG file snapshot"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Open File</span>
                          </button>
                        )}

                        {item.id && (
                          <button
                            onClick={(e) => handleDeleteHistory(item.id!, e)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Delete snapshot log"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Firestore synchronized
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer hover:scale-[1.01] active:scale-98"
          >
            Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
}
