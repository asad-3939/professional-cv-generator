import React, { useState } from "react";
import { 
  X, Brain, Sparkles, UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight, FileText
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
  currentCVData,
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

  // File Upload Helper (Only accepts doc, docx, pdf, jpg, jpeg, png)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["doc", "docx", "pdf", "jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setErrorMsg("Invalid file format. Please upload only DOC, DOCX, PDF, JPEG, or PNG files.");
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
        setImportText(""); // Clear text if they uploaded a file instead
        setSuccessMsg(`File "${file.name}" loaded successfully! Click "Parse & Import" below to structure it with AI.`);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the uploaded file.");
    };
    reader.readAsDataURL(file);
  };

  // AI Parse Request
  const handleAICVImport = async () => {
    if (!uploadedFile && !importText.trim()) {
      setErrorMsg("Please upload a file above or paste your resume details manually.");
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
        throw new Error(resData.error || "Failed to parse resume text");
      }

      if (resData.cvData) {
        setParsedResult(resData.cvData);
        setSuccessMsg("Outstanding! AI successfully analyzed, scanned, and compiled your resume file. Click 'Populate Fields & Start Editing' below to view it!");
        
        // Log AI Import to Firestore if signed in
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "AI CV Import",
              description: `Imported existing resume file/text: "${resData.cvData.personal?.fullName || "Professional"}"`
            })
          }, { merge: true }).catch(err => console.error(err));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        id="ai_assistant_modal_container"
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl text-white">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">AI CV Parser & Importer</h2>
              <p className="text-[10px] text-slate-400">Power up your career materials using Advanced AI Models</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer select-none"
            id="ai_modal_close_btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Global Alert messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          <div className="space-y-6">
            
            {!parsedResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Input file / text */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Step 1: Provide Resume/CV</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Upload your previous resume. We accept standard Word (.doc/.docx), PDFs, or JPEGs/PNGs.
                    </p>
                  </div>

                  {/* Drag and Drop */}
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 rounded-xl p-8 transition text-center flex flex-col items-center justify-center group">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title=""
                    />
                    <UploadCloud className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 transition-colors mb-3" />
                    <span className="text-xs font-bold text-slate-300">
                      {uploadedFile ? "Replace uploaded file" : "Drop your previous resume here"}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Supports DOC, DOCX, PDF, JPEG, PNG</span>
                  </div>

                  {uploadedFile && (
                    <div className="p-2.5 bg-indigo-950/30 border border-indigo-900/30 rounded-lg flex items-center justify-between text-[11px] text-indigo-300">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate font-semibold">{uploadedFile.name}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setUploadedFile(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or Paste Text Instead:</span>
                      {importText.trim().length > 0 && (
                        <button 
                          onClick={() => setImportText("")}
                          className="text-[9px] text-slate-500 hover:text-slate-300 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Or paste your existing resume raw details here..."
                      value={importText}
                      onChange={(e) => {
                        setImportText(e.target.value);
                        if (uploadedFile) setUploadedFile(null); // Clear file if text pasted
                      }}
                      rows={5}
                      className="w-full p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none font-mono"
                    />
                  </div>
                </div>

                {/* Right Column: Information & Actions */}
                <div className="flex flex-col justify-between p-5 bg-slate-950/40 rounded-xl border border-slate-850 space-y-4">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Document Parser</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Our advanced AI intelligence processes files and image scans to extract:
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Personal coordinates & social profiles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Work history, achievements & companies</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Academic milestones, fields of study & dates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Technical skills, languages, and certifications</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleAICVImport}
                      disabled={isParsingCV || (!uploadedFile && !importText.trim())}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black rounded-xl text-xs transition cursor-pointer select-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                    >
                      {isParsingCV ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI Reading File...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          <span>Parse & Import with AI</span>
                        </>
                      )}
                    </button>

                    <p className="text-[9px] text-slate-500 leading-normal text-center">
                      ⚠️ Overwrites any active builder draft in progress upon confirming.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              /* Successful parsed preview state */
              <div className="space-y-5">
                <div className="p-5 bg-indigo-500/5 rounded-xl border border-indigo-500/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Ready to load</span>
                      <h3 className="text-sm font-black text-white mt-0.5">Parsed Resume: {parsedResult.personal?.fullName || "Unspecified"}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setParsedResult(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white transition font-bold"
                    >
                      Re-upload / Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Contact Coordinates</span>
                      <p className="text-[11px] text-slate-300 mt-1 font-mono truncate">{parsedResult.personal?.email || "No email"}</p>
                      <p className="text-[11px] text-slate-300 font-mono truncate">{parsedResult.personal?.phone || "No phone"}</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Work Experience</span>
                      <p className="text-xs text-slate-300 mt-1 font-bold">{parsedResult.experience?.length || 0} entries found</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{parsedResult.experience?.[0]?.company || ""}</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Skills & Languages</span>
                      <p className="text-xs text-slate-300 mt-1 font-bold">{parsedResult.skills?.length || 0} skill tags parsed</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{parsedResult.skills?.slice(0, 3).join(", ")}...</p>
                    </div>
                  </div>

                  <button
                    onClick={executeStartEditing}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl text-xs transition cursor-pointer select-none shadow-2xl shadow-indigo-600/30"
                  >
                    <span>🚀 Populate Fields & Start Editing CV Builder</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer controls */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition select-none cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
