import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, FileText, Loader2, AlertCircle, CheckCircle2, 
  FolderOpen, ChevronDown, Check, ArrowRight, X, Sparkles, Plus, LogIn
} from "lucide-react";
import { CVData, CVRecord, DesignConfig } from "../../types";

export interface ResumeUploadProps {
  onUploadSuccess: (parsedCV: CVData, title: string) => void;
  currentUser?: { email: string; displayName: string; uid: string } | null;
  userCVs?: CVRecord[];
  onSelectSavedCV?: (cvRecord: { data: CVData; design: DesignConfig; title: string; id?: string }) => void;
  currentCvTitle?: string;
  onSignInPrompt?: () => void;
  variant?: "hero" | "compact";
  title?: string;
  subtitle?: string;
  primaryActionLabel?: string;
  className?: string;
  showCurrentCVBadge?: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUploadSuccess,
  currentUser,
  userCVs = [],
  onSelectSavedCV,
  currentCvTitle,
  onSignInPrompt,
  variant = "hero",
  title,
  subtitle,
  primaryActionLabel = "Choose File",
  className = "",
  showCurrentCVBadge = true
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>("Reading document...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSavedCVsModal, setShowSavedCVsModal] = useState<boolean>(false);
  const [showPasteArea, setShowPasteArea] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to validate and process file
  const processSelectedFile = async (file: File) => {
    // 1. Validate file size (< 10MB)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${MAX_SIZE_MB}MB size limit. Please select a smaller document.`);
      return;
    }

    // 2. Validate format
    const allowedExtensions = ["pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(ext)) {
      setErrorMessage("Unsupported file format. Please upload a PDF, DOCX, DOC, or TXT file.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgressStage("Reading document bytes...");

    // Simulated stepped feedback for professional UX
    const stageTimer1 = setTimeout(() => {
      setUploadProgressStage("Parsing sections, work history & skills...");
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setUploadProgressStage("Extracting contact & formatting details...");
    }, 3200);

    try {
      const base64 = await readFileAsBase64(file);
      
      const payload = {
        fileData: {
          base64,
          mimeType: file.type || getMimeTypeFromExt(ext),
          name: file.name
        }
      };

      const response = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Resume parsing failed (Status ${response.status})`);
      }

      const result = await response.json();
      if (!result.cvData) {
        throw new Error("Unable to extract structured resume content from this file.");
      }

      const generatedTitle = result.cvData.personal?.fullName?.trim() 
        ? `${result.cvData.personal.fullName}'s Resume` 
        : (file.name.replace(/\.[^/.]+$/, "") || "Imported Resume");

      onUploadSuccess(result.cvData, generatedTitle);
    } catch (err: any) {
      console.error("Resume upload error:", err);
      setErrorMessage(err.message || "Failed to process resume file. Please verify the document format or paste your text.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsUploading(false);
      setUploadProgressStage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processSelectedFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handlePastedTextSubmit = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 30) {
      setErrorMessage("Please paste at least a few lines of resume text (minimum 30 characters).");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgressStage("Extracting resume structure from text...");

    try {
      const response = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Text import failed (Status ${response.status})`);
      }

      const result = await response.json();
      if (!result.cvData) {
        throw new Error("Could not parse resume sections from the provided text.");
      }

      const generatedTitle = result.cvData.personal?.fullName?.trim() 
        ? `${result.cvData.personal.fullName}'s Resume` 
        : "Imported Resume";

      onUploadSuccess(result.cvData, generatedTitle);
      setShowPasteArea(false);
      setPastedText("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse pasted resume text.");
    } finally {
      setIsUploading(false);
      setUploadProgressStage("");
    }
  };

  const handleSelectSaved = (cv: CVRecord) => {
    if (onSelectSavedCV) {
      onSelectSavedCV({
        data: cv.data,
        design: cv.design,
        title: cv.title,
        id: cv.id
      });
    } else {
      onUploadSuccess(cv.data, cv.title);
    }
    setShowSavedCVsModal(false);
  };

  const hasSavedCVs = Boolean(currentUser && userCVs && userCVs.length > 0);

  return (
    <div className={`relative font-sans text-left ${className}`}>
      
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,image/*"
        className="hidden"
        id="resume_upload_native_input"
        disabled={isUploading}
      />

      {/* Main Upload Container */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (isUploading) return;
          const target = e.target as HTMLElement;
          if (target.closest("button, textarea, a, input")) return;
          fileInputRef.current?.click();
        }}
        className={`rounded-2xl transition-all duration-200 border relative overflow-hidden group cursor-pointer ${
          isDragging 
            ? "border-teal-400 bg-teal-950/30 ring-2 ring-teal-400/40" 
            : isUploading 
              ? "border-teal-500/40 bg-slate-900/90 cursor-default" 
              : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90"
        } ${variant === "hero" ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}
      >

        {/* Current CV status strip if available */}
        {showCurrentCVBadge && currentCvTitle && (
          <div className="mb-4 pb-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-400">Current Resume:</span>
              <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs">
                {currentCvTitle}
              </span>
            </div>
            {hasSavedCVs && (
              <button
                type="button"
                onClick={() => setShowSavedCVsModal(true)}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <span>Switch resume</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Upload In Progress State */}
        {isUploading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Importing &amp; Parsing Resume
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {uploadProgressStage}
              </p>
            </div>
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-indeterminate" />
            </div>
          </div>
        ) : showPasteArea ? (
          /* Text Paste Fallback Area */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Paste Resume Text</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPasteArea(false)}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Back to file upload
              </button>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your full resume text here including work experience, skills, and education..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteArea(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePastedTextSubmit}
                disabled={!pastedText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Parse Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Upload & Drag-and-Drop Area */
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Primary Action Button & Icon */}
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 text-teal-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title || "Drop your resume here"}
            </h3>
            
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed font-medium">
              {subtitle || "PDF, DOCX, DOC or TXT • Max 10MB"}
            </p>

            {/* CTAs Row */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2"
                id="resume_upload_choose_file_btn"
              >
                <Upload className="w-4 h-4" />
                <span>{primaryActionLabel || "Choose File"}</span>
              </button>

              {/* Select from My CVs option for logged-in users */}
              {hasSavedCVs ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSavedCVsModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                  id="resume_upload_select_saved_btn"
                >
                  <FolderOpen className="w-4 h-4 text-teal-400" />
                  <span>Select from My CVs ({userCVs.length})</span>
                </button>
              ) : currentUser ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasteArea(true);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer py-1.5 px-3"
                >
                  Or paste text
                </button>
              ) : onSignInPrompt ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignInPrompt();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition border border-slate-700/80 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sign in for saved CVs</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasteArea(true);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer py-1.5 px-3"
                >
                  Or paste text
                </button>
              )}
            </div>

            {/* Quick paste shortcut if user has saved CVs button shown */}
            {hasSavedCVs && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPasteArea(true);
                }}
                className="mt-2.5 text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                Or paste resume text directly
              </button>
            )}

          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Upload Notice</p>
              <p className="text-[11px] text-rose-300 mt-0.5 leading-snug">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss upload error notice"
              className="text-rose-400 hover:text-rose-200 transition cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* Saved Resumes Selection Modal */}
      {showSavedCVsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSavedCVsModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowSavedCVsModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-cvs-modal-title"
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 text-left relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                <h3 id="saved-cvs-modal-title" className="text-base font-bold text-white tracking-tight">
                  Select from My Saved Resumes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedCVsModal(false)}
                aria-label="Close saved resumes dialog"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Choose one of your saved resumes to load immediately:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {userCVs.map((cv) => {
                const isCurrent = cv.title === currentCvTitle;
                const candidateName = cv.data?.personal?.fullName || "Unnamed";
                const candidateRole = cv.data?.personal?.jobTitle || "Professional";

                return (
                  <button
                    key={cv.id}
                    type="button"
                    onClick={() => handleSelectSaved(cv)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? "bg-indigo-950/40 border-indigo-500/50 text-white"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {cv.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {candidateName} &bull; {candidateRole}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 border border-indigo-800/40 px-2 py-0.5 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-white">
                          Select
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSavedCVsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper to convert file to base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const commaIdx = content.indexOf(",");
        resolve(commaIdx !== -1 ? content.substring(commaIdx + 1) : content);
      } else {
        reject(new Error("Empty file content read."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file from disk."));
    reader.readAsDataURL(file);
  });
}

function getMimeTypeFromExt(ext: string): string {
  switch (ext) {
    case "pdf": return "application/pdf";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc": return "application/msword";
    case "txt": return "text/plain";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    default: return "application/octet-stream";
  }
}
