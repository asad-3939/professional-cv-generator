import React, { useState, useRef } from "react";
import { 
  FileText, UploadCloud, ChevronDown, Check, User, 
  Sparkles, Loader2, AlertCircle, Edit3, LogIn, Plus
} from "lucide-react";
import { CVData, CVRecord, DesignConfig } from "../../types";

export interface CVSelectorBarProps {
  selectedCvData: CVData;
  selectedDesignConfig?: DesignConfig;
  selectedCvTitle: string;
  selectedCvId?: string;
  userCVs?: CVRecord[];
  currentUser: { email: string; displayName: string; uid: string } | null;
  onSelectCV: (cvRecord: { data: CVData; design: DesignConfig; title: string; id?: string }) => void;
  onOpenInEditor: () => void;
  onOpenAuth: () => void;
  onImportSuccess: (parsedCV: CVData, title: string) => void;
}

export const CVSelectorBar: React.FC<CVSelectorBarProps> = ({
  selectedCvData,
  selectedDesignConfig,
  selectedCvTitle,
  selectedCvId,
  userCVs = [],
  currentUser,
  onSelectCV,
  onOpenInEditor,
  onOpenAuth,
  onImportSuccess
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  
  // Import state
  const [importText, setImportText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const candidateName = selectedCvData.personal?.fullName || "Unnamed Candidate";
  const candidateRole = selectedCvData.personal?.jobTitle || "Professional";

  // Handle file select for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setImportError("Please upload a valid PDF, DOCX, TXT, or image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const commaIdx = content.indexOf(",");
        const base64 = commaIdx !== -1 ? content.substring(commaIdx + 1) : content;
        setUploadedFile({
          base64,
          mimeType: file.type || "application/octet-stream",
          name: file.name
        });
        setImportError(null);
      }
    };
    reader.onerror = () => {
      setImportError("Could not read file from disk.");
    };
    reader.readAsDataURL(file);
  };

  // Perform AI Import
  const handleExecuteImport = async () => {
    if (!uploadedFile && !importText.trim()) {
      setImportError("Please upload a resume file or paste raw resume text.");
      return;
    }

    setIsParsing(true);
    setImportError(null);

    try {
      const body: any = {};
      if (uploadedFile) {
        body.fileData = {
          base64: uploadedFile.base64,
          mimeType: uploadedFile.mimeType,
          name: uploadedFile.name
        };
      } else {
        body.text = importText.trim();
      }

      const res = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Import failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.cvData) {
        const titleName = data.cvData.personal?.fullName 
          ? `${data.cvData.personal.fullName}'s Resume`
          : (uploadedFile?.name || "Imported Resume");
        
        onImportSuccess(data.cvData, titleName);
        setIsImportModalOpen(false);
        setUploadedFile(null);
        setImportText("");
      } else {
        throw new Error("No structured CV data received from the import parser.");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setImportError(err.message || "Failed to parse resume.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Active CV Metadata & Switcher */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Resume Under Audit
              </span>
              {currentUser ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Cloud Synced
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  Local Draft
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {selectedCvTitle}
              </h3>
              <span className="text-slate-500 text-xs hidden sm:inline">&bull;</span>
              <span className="text-xs text-indigo-300 font-medium truncate hidden sm:inline">
                {candidateName} ({candidateRole})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* CV Selector Dropdown (When logged in and has CVs) */}
          {currentUser && userCVs.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                id="cv_selector_dropdown_btn"
              >
                <span>Switch Saved CV ({userCVs.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Your Saved Resumes
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {userCVs.map((cv) => {
                        const isSelected = cv.id === selectedCvId;
                        return (
                          <button
                            key={cv.id}
                            onClick={() => {
                              onSelectCV({
                                data: cv.data,
                                design: cv.design,
                                title: cv.title || "Saved Resume",
                                id: cv.id
                              });
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold truncate text-white">{cv.title || "Untitled Resume"}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {cv.data.personal?.fullName || "Candidate"} &bull; {cv.data.experience?.length || 0} jobs
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Import / Upload Resume Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            id="cv_selector_import_btn"
          >
            <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload / Import CV</span>
          </button>

          {/* Sign In Prompt if not logged in */}
          {!currentUser && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold transition cursor-pointer"
              id="cv_selector_signin_btn"
              title="Sign in to save and load your cloud resumes"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign In to Load CVs</span>
            </button>
          )}

          {/* Open in CV Editor CTA */}
          <button
            onClick={onOpenInEditor}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-indigo-600/20 cursor-pointer"
            id="cv_selector_open_editor_btn"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in CV Builder</span>
          </button>
        </div>
      </div>

      {/* Quick Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import Your Resume</h3>
                  <p className="text-[11px] text-slate-400">Upload a PDF/DOCX or paste resume text to test.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                  setUploadedFile(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* File Upload Drop Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 bg-slate-950/60 rounded-xl p-5 text-center cursor-pointer transition space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-teal-500/10 flex items-center justify-center mx-auto text-slate-400 group-hover:text-teal-400 transition">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {uploadedFile ? uploadedFile.name : "Click to select a file (PDF, DOCX, TXT)"}
                </p>
                <p className="text-[10px] text-slate-500">Fast parsing of existing work history &amp; skills</p>
              </div>
            </div>

            {/* Textarea Fallback */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Or paste raw resume text:</label>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  if (uploadedFile) setUploadedFile(null);
                }}
                placeholder="Paste the text of your CV here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isParsing || (!uploadedFile && !importText.trim())}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Import &amp; Audit</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
