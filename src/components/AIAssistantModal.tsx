import React, { useState } from "react";
import { 
  X, UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight, FileText, Sparkles
} from "lucide-react";
import { CVData } from "../types";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCVData: CVData;
  onImportSuccess: (parsedCV: CVData) => void;
  currentUser: { email: string; displayName: string; uid: string } | null;
}

const getMimeTypeFromExt = (ext: string): string => {
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc": return "application/msword";
    default: return "application/octet-stream";
  }
};

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentUser
}) => {
  // Parse States
  const [importText, setImportText] = useState<string>("");
  const [isParsingCV, setIsParsingCV] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<CVData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);

  // Status indicators
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["doc", "docx", "pdf", "jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setErrorMsg("Invalid file format. Please upload a PDF, DOCX, or image file.");
      setSuccessMsg(null);
      setUploadedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const commaIdx = content.indexOf(",");
        const base64Content = commaIdx !== -1 ? content.substring(commaIdx + 1) : content;
        
        setUploadedFile({
          base64: base64Content,
          mimeType: file.type || getMimeTypeFromExt(ext),
          name: file.name
        });
        setImportText("");
        setSuccessMsg(`File "${file.name}" ready to import.`);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the uploaded file.");
    };
    reader.readAsDataURL(file);
  };

  // Import Request
  const handleAICVImport = async () => {
    if (!uploadedFile && !importText.trim()) {
      setErrorMsg("Please upload a resume file or paste your resume text.");
      return;
    }

    setIsParsingCV(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const body: any = {};
      if (uploadedFile) {
        body.fileData = {
          base64: uploadedFile.base64,
          mimeType: uploadedFile.mimeType,
          name: uploadedFile.name
        };
      } else {
        body.text = importText;
      }

      const response = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      let resData: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(resData.error || "Failed to parse resume");
      }

      if (resData.cvData) {
        setParsedResult(resData.cvData);
        setSuccessMsg("Resume parsed successfully! Review the extracted data below.");
        
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "Resume Import",
              description: `Imported resume: "${resData.cvData.personal?.fullName || "Candidate"}"`
            })
          }, { merge: true }).catch(console.error);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while importing your resume.");
    } finally {
      setIsParsingCV(false);
    }
  };

  const executeStartEditing = () => {
    if (parsedResult) {
      onImportSuccess(parsedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        id="ai_assistant_modal_container"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Import Existing Resume</h2>
              <p className="text-[11px] text-slate-400">Upload a PDF or Word document to auto-fill your builder fields</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            id="ai_modal_close_btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!parsedResult ? (
            <div className="space-y-4">
              
              {/* File Upload Zone */}
              <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/50 rounded-xl p-8 transition text-center flex flex-col items-center justify-center group cursor-pointer">
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 transition-colors mb-2.5" />
                <span className="text-xs font-bold text-slate-200">
                  {uploadedFile ? uploadedFile.name : "Click to select or drag and drop your resume"}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Accepts PDF, DOCX, DOC, JPEG, and PNG files</span>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold">{uploadedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setUploadedFile(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Paste raw text alternative */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-400 block">Or paste resume text directly:</label>
                <textarea
                  placeholder="Paste work experience, education, and skills text here..."
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (uploadedFile) setUploadedFile(null);
                  }}
                  rows={4}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              <button
                onClick={handleAICVImport}
                disabled={isParsingCV || (!uploadedFile && !importText.trim())}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isParsingCV ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Resume Content...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import & Extract Content</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Parsed Summary Preview */
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Extracted Successfully</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{parsedResult.personal?.fullName || "Extracted Candidate"}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setParsedResult(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition font-medium"
                  >
                    Upload Different File
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Contact Info</span>
                    <p className="text-xs text-slate-300 mt-1 truncate">{parsedResult.personal?.email || "No email"}</p>
                    <p className="text-xs text-slate-400 truncate">{parsedResult.personal?.location || ""}</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Work Experience</span>
                    <p className="text-xs text-slate-200 font-bold mt-1">{parsedResult.experience?.length || 0} Positions</p>
                    <p className="text-xs text-slate-400 truncate">{parsedResult.experience?.[0]?.company || ""}</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Skills Extracted</span>
                    <p className="text-xs text-slate-200 font-bold mt-1">{parsedResult.skills?.length || 0} Skills</p>
                    <p className="text-xs text-slate-400 truncate">{parsedResult.skills?.slice(0, 3).join(", ")}</p>
                  </div>
                </div>

                <button
                  onClick={executeStartEditing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  <span>Load Into Resume Builder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
