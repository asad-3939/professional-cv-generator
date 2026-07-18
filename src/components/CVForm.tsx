import React, { useState } from "react";
import { 
  User, Briefcase, GraduationCap, Code, FileText, Settings, Award, 
  Languages, Plus, Trash2, Palette, Sparkles, SlidersHorizontal, Loader2, Check,
  Brain, UploadCloud, CheckCircle2, AlertCircle, TrendingUp, BarChart3, HelpCircle, FileCheck
} from "lucide-react";
import { CVData, DesignConfig, WorkExperience, Education, Project, Certification, Language, TemplateId } from "../types";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";

interface CVFormProps {
  data: CVData;
  onChange: (data: CVData) => void;
  design: DesignConfig;
  onDesignChange: (design: DesignConfig) => void;
  currentUser: { email: string; displayName: string; uid: string } | null;
  activeTab?: string;
  onActiveTabChange?: (tab: string) => void;
}

export const CVForm: React.FC<CVFormProps> = ({ 
  data, 
  onChange, 
  design, 
  onDesignChange, 
  currentUser,
  activeTab: controlledActiveTab,
  onActiveTabChange
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>("design");
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = onActiveTabChange !== undefined ? onActiveTabChange : setLocalActiveTab;

  const [skillInput, setSkillInput] = useState<string>("");
  
  // Local loading states for AI features
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for AI Import & ATS Scoring
  const [importText, setImportText] = useState<string>("");
  const [isParsingCV, setIsParsingCV] = useState<boolean>(false);
  const [atsJobDesc, setAtsJobDesc] = useState<string>("");
  const [isAnalyzingATS, setIsAnalyzingATS] = useState<boolean>(false);
  const [atsResult, setAtsResult] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs layout config
  const tabs = [
    { id: "design", label: "Styles & Config", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: "personal", label: "Personal Info", icon: <User className="w-4 h-4" /> },
    { id: "summary", label: "Profile Summary", icon: <FileText className="w-4 h-4" /> },
    { id: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" /> },
    { id: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "skills", label: "Skills", icon: <Code className="w-4 h-4" /> },
    { id: "projects", label: "Projects", icon: <Award className="w-4 h-4" /> },
    { id: "certifications", label: "Credentials", icon: <Award className="w-4 h-4" /> },
    { id: "languages", label: "Languages", icon: <Languages className="w-4 h-4" /> },
  ];

  // Helper to trigger overall state updates
  const updatePersonal = (field: string, value: string) => {
    onChange({
      ...data,
      personal: {
        ...data.personal,
        [field]: value
      }
    });
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, summary: e.target.value });
  };

  // AI 1: Generate Professional Summary based on target role & skills
  const handleAIGenerateSummary = async () => {
    const jobTitle = data.personal.jobTitle;
    if (!jobTitle) {
      setErrorMsg("Please fill in a Job Title in 'Personal Info' first so we can tailor the profile.");
      setActiveTab("personal");
      return;
    }

    setIsGeneratingSummary(true);
    setErrorMsg(null);

    try {
      // Gather experience details to feed into AI
      const highlights = data.experience.map(exp => `${exp.position} at ${exp.company}`);
      const response = await fetch("/api/cv/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          skills: data.skills,
          experiences: highlights
        })
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
        throw new Error(resData.error || "Failed to generate summary");
      }

      if (resData.summary) {
        const updatedData = { ...data, summary: resData.summary };
        onChange(updatedData);

        // Save generated profile to users collection under their unique User ID if logged in (non-blocking)
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            email: currentUser.email,
            fullName: updatedData.personal.fullName || currentUser.displayName || "",
            createdAt: new Date().toISOString(),
            cvData: updatedData,
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "AI Summary Generation",
              description: `Generated professional summary for "${updatedData.personal.jobTitle || "Resume"}"`,
              details: resData.summary.substring(0, 150) + "..."
            })
          }, { merge: true }).then(() => {
            console.log("Successfully saved generated profile to Firestore for uid:", currentUser.uid);
          }).catch((fsErr) => {
            console.error("Error saving profile to Firestore:", fsErr);
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while generating summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI 2: Polish Experience Bullet Points
  const handleAIPolishExperience = async (id: string, currentText: string) => {
    if (!currentText.trim()) {
      setErrorMsg("Please add some experience details first before polishing.");
      return;
    }

    setPolishingId(id);
    setErrorMsg(null);

    try {
      const expItem = data.experience.find(exp => exp.id === id);
      const response = await fetch("/api/cv/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentText,
          position: expItem?.position,
          company: expItem?.company,
          jobTitle: data.personal.jobTitle
        })
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
        throw new Error(resData.error || "Failed to polish text");
      }

      if (resData.polishedText) {
        const updatedExp = data.experience.map(exp => {
          if (exp.id === id) {
            return { ...exp, description: resData.polishedText };
          }
          return exp;
        });
        const updatedData = { ...data, experience: updatedExp };
        onChange(updatedData);

        // Save generated profile/history to Firestore under their unique User ID if logged in (non-blocking)
        if (currentUser) {
          const expItem = data.experience.find(exp => exp.id === id);
          setDoc(doc(db, "users", currentUser.uid), {
            cvData: updatedData,
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "AI Experience Polish",
              description: `Polished bullets for position "${expItem?.position || "Role"}" at "${expItem?.company || "Company"}"`,
              details: resData.polishedText.substring(0, 150) + "..."
            })
          }, { merge: true }).then(() => {
            console.log("Successfully logged experience polish event to Firestore");
          }).catch((fsErr) => {
            console.error("Error saving experience polish history:", fsErr);
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to polish text.");
    } finally {
      setPolishingId(null);
    }
  };

  // AI 3: Suggest Skills based on Job Title
  const handleAISuggestSkills = async () => {
    const jobTitle = data.personal.jobTitle;
    if (!jobTitle) {
      setErrorMsg("Please fill in a Job Title in 'Personal Info' first to fetch appropriate skills.");
      setActiveTab("personal");
      return;
    }

    setIsSuggestingSkills(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/cv/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle })
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
        throw new Error(resData.error || "Failed to fetch skills");
      }

      // Merge new skills excluding duplicates
      const freshSkills = resData.skills || [];
      const mergedSkills = Array.from(new Set([...data.skills, ...freshSkills]));
      
      // Merge certifications if retrieved
      let mergedCerts = [...data.certifications];
      const recCerts = resData.certifications || [];
      recCerts.forEach((certName: string) => {
        const alreadyHas = data.certifications.some(c => c.name.toLowerCase() === certName.toLowerCase());
        if (!alreadyHas) {
          mergedCerts.push({
            id: `cert-ai-${Date.now()}-${Math.random()}`,
            name: certName,
            issuer: "Recommended Certificate",
            date: "New"
          });
        }
      });

      const updatedData = {
        ...data,
        skills: mergedSkills,
        certifications: mergedCerts
      };

      onChange(updatedData);

      // Save generated profile/history to Firestore under their unique User ID if logged in (non-blocking)
      if (currentUser) {
        setDoc(doc(db, "users", currentUser.uid), {
          cvData: updatedData,
          aiGenerations: arrayUnion({
            timestamp: new Date().toISOString(),
            type: "AI Skill Suggestions",
            description: `Suggested skills and certifications for Job Title "${jobTitle}"`,
            details: `Suggested keywords: ${freshSkills.slice(0, 5).join(", ")}`
          })
        }, { merge: true }).then(() => {
          console.log("Successfully logged AI skill suggestions to Firestore");
        }).catch((fsErr) => {
          console.error("Error saving AI skills history:", fsErr);
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not suggest skills.");
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  // File Upload Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && (parsed.personal || parsed.experience || parsed.skills)) {
            onChange(parsed);
            setSuccessMsg("Success! Detected a structured JSON backup. Restored entire CV fields instantly.");
            return;
          }
        } catch (e) {
          // Standard text file, proceed to set import text
        }
        setImportText(content);
        setSuccessMsg(`File "${file.name}" loaded successfully! Click "Parse & Import" below to structure it with AI.`);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the uploaded file. Please paste your text manually.");
    };
    reader.readAsText(file);
  };

  // AI CV Import & Parse
  const handleAICVImport = async () => {
    if (!importText.trim()) {
      setErrorMsg("Please enter or paste your resume text first, or choose a file above.");
      return;
    }

    setIsParsingCV(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText })
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
        onChange(resData.cvData);
        setSuccessMsg("Incredible! AI successfully analyzed and parsed your CV into our live fields. View and refine it on the right!");
        setImportText(""); // Clear text area upon successful import
        
        // Log AI Import Event to Firestore under user if authenticated
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            cvData: resData.cvData,
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "AI CV Import & Parse",
              description: `Imported and parsed existing resume of "${resData.cvData.personal?.fullName || "Professional"}"`
            })
          }, { merge: true }).then(() => {
            console.log("Logged CV import event successfully to Firestore");
          }).catch((fsErr) => {
            console.error("Firestore log error:", fsErr);
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while importing your resume.");
    } finally {
      setIsParsingCV(false);
    }
  };

  // AI ATS Audit
  const handleAIATSCheck = async () => {
    setIsAnalyzingATS(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/cv/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvData: data,
          jobDescription: atsJobDesc
        })
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
        throw new Error(resData.error || "Failed to analyze compatibility");
      }

      if (resData) {
        setAtsResult(resData);
        setSuccessMsg("ATS Optimization Audit Complete! Read your detailed readiness reports below.");

        // Log ATS Score Event to Firestore
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "ATS Audit & Check",
              description: `Conducted ATS Score Audit for role: "${data.personal?.jobTitle || "Role"}"`,
              details: `ATS Score: ${resData.score}/100 - Rating: ${resData.rating}`
            })
          }, { merge: true }).then(() => {
            console.log("Logged ATS Audit event to Firestore");
          }).catch((fsErr) => {
            console.error("Firestore log error:", fsErr);
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during the ATS analysis.");
    } finally {
      setIsAnalyzingATS(false);
    }
  };

  // Crud helpers: Experience
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    };
    onChange({
      ...data,
      experience: [newExp, ...data.experience]
    });
  };

  const updateExperienceItem = (id: string, field: keyof WorkExperience, value: any) => {
    const updated = data.experience.map(exp => {
      if (exp.id === id) {
        const item = { ...exp, [field]: value };
        // If set to current, erase endDate
        if (field === 'current' && value === true) {
          item.endDate = "";
        }
        return item;
      }
      return exp;
    });
    onChange({ ...data, experience: updated });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter(exp => exp.id !== id)
    });
  };

  // Crud helpers: Education
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      school: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      notes: ""
    };
    onChange({
      ...data,
      education: [newEdu, ...data.education]
    });
  };

  const updateEducationItem = (id: string, field: keyof Education, value: any) => {
    const updated = data.education.map(edu => {
      if (edu.id === id) {
        const item = { ...edu, [field]: value };
        if (field === 'current' && value === true) {
          item.endDate = "";
        }
        return item;
      }
      return edu;
    });
    onChange({ ...data, education: updated });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter(edu => edu.id !== id)
    });
  };

  // Skills handlers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !data.skills.includes(clean)) {
      onChange({
        ...data,
        skills: [...data.skills, clean]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    onChange({
      ...data,
      skills: data.skills.filter((_, idx) => idx !== indexToRemove)
    });
  };

  // Projects handlers
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: "",
      technologies: "",
      description: "",
      link: ""
    };
    onChange({
      ...data,
      projects: [...data.projects, newProj]
    });
  };

  const updateProjectItem = (id: string, field: keyof Project, value: string) => {
    const updated = data.projects.map(proj => {
      if (proj.id === id) {
        return { ...proj, [field]: value };
      }
      return proj;
    });
    onChange({ ...data, projects: updated });
  };

  const removeProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter(proj => proj.id !== id)
    });
  };

  // Certifications handlers
  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      date: ""
    };
    onChange({ ...data, certifications: [...data.certifications, newCert] });
  };

  const updateCertificationItem = (id: string, field: keyof Certification, value: string) => {
    const updated = data.certifications.map(cert => {
      if (cert.id === id) {
        return { ...cert, [field]: value };
      }
      return cert;
    });
    onChange({ ...data, certifications: updated });
  };

  const removeCertification = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter(cert => cert.id !== id)
    });
  };

  // Languages handlers
  const addLanguage = () => {
    const newLang: Language = {
      id: `lang-${Date.now()}`,
      name: "",
      proficiency: "Fluent"
    };
    onChange({ ...data, languages: [...data.languages, newLang] });
  };

  const updateLanguageItem = (id: string, field: keyof Language, value: string) => {
    const updated = data.languages.map(lang => {
      if (lang.id === id) {
        return { ...lang, [field]: value };
      }
      return lang;
    });
    onChange({ ...data, languages: updated });
  };

  const removeLanguage = (id: string) => {
    onChange({
      ...data,
      languages: data.languages.filter(lang => lang.id !== id)
    });
  };

  // Color preset options
  const colorPresets = [
    { label: "Executive Blue", value: "#1e3a8a" },
    { label: "Emerald Green", value: "#047857" },
    { label: "Crimson Red", value: "#be123c" },
    { label: "Sleek Grape", value: "#6b21a8" },
    { label: "Tech Indigo", value: "#4338ca" },
    { label: "Midnight Black", value: "#0f172a" },
    { label: "Classy Amber", value: "#b45309" }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 overflow-hidden">
      {/* Title */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <div>
          <h2 className="text-md font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="p-1 px-2 bg-blue-600 rounded text-xs">CV</span> Form Configuration
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Edit credentials & design parameters live</p>
        </div>
      </div>

      {/* Tabs list inside Form container */}
      <div className="flex bg-slate-950 p-2 overflow-x-auto gap-1 border-b border-slate-800 shrink-0 select-none scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setErrorMsg(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === tab.id 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Form content drawer scroll */}
      <div className="p-5 flex-grow overflow-y-auto space-y-5">
        
        {/* Top level warning/error message banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        {/* --- DESIGN & STYLES TAB --- */}
        {activeTab === "design" && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-500" /> Choose Master Layout Template
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "executive", name: "The Executive", desc: "Classic, professional double-column headers." },
                  { id: "minimalist", name: "The Minimalist", desc: "Aesthetic, clean lines, maximum whitespace." },
                  { id: "creative", name: "The Creative", desc: "Sophisticated side column with tinted banner." },
                  { id: "modern", name: "Modern Tech", desc: "High-contrast dark developer style." }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => onDesignChange({ ...design, templateId: tpl.id as TemplateId })}
                    className={`p-3 text-left rounded-lg border transition cursor-pointer group ${
                      design.templateId === tpl.id 
                        ? "bg-blue-600/10 border-blue-500 text-white" 
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs">{tpl.name}</span>
                      {design.templateId === tpl.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block leading-normal">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Color */}
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                Brand Accent Color
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onDesignChange({ ...design, themeColor: preset.value })}
                    className={`w-7 h-7 rounded-full border transition relative cursor-pointer flex items-center justify-center ${
                      design.themeColor === preset.value ? "border-white scale-110" : "border-slate-700 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                  >
                    {design.themeColor === preset.value && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                  </button>
                ))}
                
                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <input
                    type="color"
                    value={design.themeColor}
                    onChange={(e) => onDesignChange({ ...design, themeColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-slate-950 border border-slate-800"
                  />
                  <span className="text-[10px] font-mono text-slate-400">{design.themeColor}</span>
                </div>
              </div>
            </div>

            {/* Typography and Margins */}
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Layout Formatting
              </h3>
              
              {/* Font Family Selection */}
              <div>
                <label className="text-[11px] text-slate-400 uppercase tracking-widest block mb-1.5">Typography Font</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "sans", name: "Inter (Sans)" },
                    { id: "serif", name: "Playfair (Serif)" },
                    { id: "mono", name: "Mono Tech" },
                    { id: "grotesk", name: "Outfit Elegant" }
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => onDesignChange({ ...design, fontFamily: font.id as any })}
                      className={`py-1.5 px-2 rounded text-[10px] font-medium border cursor-pointer ${
                        design.fontFamily === font.id 
                          ? "bg-slate-800 text-white border-blue-500" 
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing Select */}
              <div>
                <label className="text-[11px] text-slate-400 uppercase tracking-widest block mb-1.5">Compactness / Spacing</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "compact", name: "Compact (Fit More)" },
                    { id: "normal", name: "Standard" },
                    { id: "relaxed", name: "Relaxed (Spacious)" }
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => onDesignChange({ ...design, spacing: sp.id as any })}
                      className={`py-1.5 px-2 rounded text-[10px] font-medium border cursor-pointer ${
                        design.spacing === sp.id 
                          ? "bg-slate-800 text-white border-blue-500" 
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {sp.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle Sections Visibility */}
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                Manage CV Sections
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { key: "showExperienceSection", label: "Work Experience Column" },
                  { key: "showEducationSection", label: "Education & Studies Details" },
                  { key: "showProjectsSection", label: "Projects Accomplishments" },
                  { key: "showCertificationsSection", label: "Professional Certifications" },
                  { key: "showLanguagesSection", label: "Languages Section" }
                ].map((cfg) => (
                  <label key={cfg.key} className="flex justify-between items-center cursor-pointer select-none">
                    <span className="text-slate-300">{cfg.label}</span>
                    <input
                      type="checkbox"
                      checked={(design as any)[cfg.key]}
                      onChange={(e) => onDesignChange({ ...design, [cfg.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- PERSONAL INFO TAB --- */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 italic">This section defines your contact information and identity header.</p>
            
            <div>
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jean-Luc Picard"
                value={data.personal.fullName}
                onChange={(e) => updatePersonal("fullName", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Target Job Title</label>
              <input
                type="text"
                placeholder="e.g. Lead Devops Engineer"
                value={data.personal.jobTitle}
                onChange={(e) => updatePersonal("jobTitle", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={data.personal.email}
                  onChange={(e) => updatePersonal("email", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  value={data.personal.phone}
                  onChange={(e) => updatePersonal("phone", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Location / Office</label>
              <input
                type="text"
                placeholder="e.g. Seattle, WA or London, UK"
                value={data.personal.location}
                onChange={(e) => updatePersonal("location", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">LinkedIn Handle</label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/..."
                  value={data.personal.linkedin}
                  onChange={(e) => updatePersonal("linkedin", e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs text-ellipsis"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">GitHub Profile</label>
                <input
                  type="text"
                  placeholder="github.com/..."
                  value={data.personal.github}
                  onChange={(e) => updatePersonal("github", e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs text-ellipsis"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Personal Web Link</label>
                <input
                  type="text"
                  placeholder="mywebsite.com"
                  value={data.personal.website}
                  onChange={(e) => updatePersonal("website", e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs text-ellipsis"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- PROFILE SUMMARY TAB --- */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Professional Profile Statement</label>
              
              {/* AI Button */}
              <button
                onClick={handleAIGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white rounded text-[10px] font-semibold tracking-wider uppercase transition cursor-pointer"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Writing Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span>AI Generate Profile</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={data.summary}
              onChange={handleSummaryChange}
              rows={6}
              placeholder="A high-level sentence highlighting key experiences, technical skills, and achievements. Keep it 3-4 professional lines."
              className="w-full p-3 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 block">
              💡 **AI Tip:** Enter your target role title and skills tags first, then click **AI Generate Profile** to draft a polished executive statement based on your profile inputs automatically!
            </p>
          </div>
        )}

        {/* --- EXPERIENCE TAB --- */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Experience Chronicle</span>
              <button
                onClick={addExperience}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Job Role
              </button>
            </div>

            {data.experience.length === 0 && (
              <p className="text-xs italic text-slate-400 text-center py-6">No experience logs provided yet. Click Add Job Role to insert one.</p>
            )}

            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-4 shadow relative">
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Job Role / Position</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Backend Engineer"
                        value={exp.position}
                        onChange={(e) => updateExperienceItem(exp.id, "position", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Company / Firm</label>
                      <input
                        type="text"
                        placeholder="e.g. Google LLC"
                        value={exp.company}
                        onChange={(e) => updateExperienceItem(exp.id, "company", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Mountain View, CA"
                        value={exp.location}
                        onChange={(e) => updateExperienceItem(exp.id, "location", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Start Date</label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperienceItem(exp.id, "startDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">End Date</label>
                        <input
                          type="month"
                          value={exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => updateExperienceItem(exp.id, "endDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperienceItem(exp.id, "current", e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700"
                      />
                      <span>I currently study or work in this role</span>
                    </label>

                    {/* AI Polish Button */}
                    <button
                      onClick={() => handleAIPolishExperience(exp.id, exp.description)}
                      disabled={polishingId === exp.id}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 disabled:opacity-55 border border-indigo-700/40 rounded text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                    >
                      {polishingId === exp.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>AI Polishing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          <span>AI Polish Bullet Points</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Descriptions / Bullet listings</label>
                    <textarea
                      placeholder="Write job achievements, tasks or highlights (one per line). Use AI to instantly convert these into professional executive bullet points!"
                      value={exp.description}
                      onChange={(e) => updateExperienceItem(exp.id, "description", e.target.value)}
                      rows={4}
                      className="w-full p-2.5 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- EDUCATION TAB --- */}
        {activeTab === "education" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Studies & Academia</span>
              <button
                onClick={addEducation}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Academic Entry
              </button>
            </div>

            {data.education.length === 0 && (
              <p className="text-xs italic text-slate-400 text-center py-6">No academic logs provided yet. Click Add Academic Entry to insert one.</p>
            )}

            <div className="space-y-5">
              {data.education.map((edu) => (
                <div key={edu.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-4 shadow relative">
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">School / University</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={edu.school}
                        onChange={(e) => updateEducationItem(edu.id, "school", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Degree / Diploma</label>
                      <input
                        type="text"
                        placeholder="e.g. Master of Science (M.S.)"
                        value={edu.degree}
                        onChange={(e) => updateEducationItem(edu.id, "degree", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Major / Field of Study</label>
                      <input
                        type="text"
                        placeholder="e.g. Artificial Intelligence"
                        value={edu.field}
                        onChange={(e) => updateEducationItem(edu.id, "field", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Start Date</label>
                        <input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) => updateEducationItem(edu.id, "startDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">End Date</label>
                        <input
                          type="month"
                          value={edu.endDate}
                          disabled={edu.current}
                          onChange={(e) => updateEducationItem(edu.id, "endDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input
                        type="checkbox"
                        checked={edu.current}
                        onChange={(e) => updateEducationItem(edu.id, "current", e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700"
                      />
                      <span>Currently studying here</span>
                    </label>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Location</label>
                      <input
                        type="text"
                        placeholder="Stanford, CA"
                        value={edu.location}
                        onChange={(e) => updateEducationItem(edu.id, "location", e.target.value)}
                        className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Honors / Extra Academic detail</label>
                    <textarea
                      placeholder="e.g. GPA 3.9/4.0. Completed advanced thesis on deep neural networks."
                      value={edu.notes}
                      onChange={(e) => updateEducationItem(edu.id, "notes", e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SKILLS TAB --- */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Personal Core Expertise</label>
              
              {/* AI Trigger */}
              <button
                onClick={handleAISuggestSkills}
                disabled={isSuggestingSkills}
                className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white rounded text-[10px] font-semibold tracking-wider uppercase transition cursor-pointer"
              >
                {isSuggestingSkills ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={3} />
                    <span>Analyzing Title...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                    <span>AI Find Core Skills</span>
                  </>
                )}
              </button>
            </div>

            {/* Input field to manually key skills */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a skill (e.g. Docker, Python) & press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-grow px-3 py-2 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500 text-xs"
              />
              <button
                type="submit"
                className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Skill badgelist */}
            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg min-h-32">
              {data.skills.length === 0 ? (
                <p className="text-xs italic text-slate-500 text-center py-8">No skills keyed in yet. Key manually above or use the AI finder.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 py-1 px-2 bg-slate-800/80 border border-slate-700 rounded text-xs font-medium text-slate-200"
                    >
                      <span>{skill}</span>
                      <button 
                        type="button" 
                        onClick={() => removeSkill(index)} 
                        className="text-slate-400 hover:text-rose-400 font-bold ml-1 transition shrink-0 cursor-pointer text-[10px]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              💡 **AI Finder:** Click the **AI Find Core Skills** button to analyze your target Job Title and append 10+ popular industry-relevant technologies and matching certifications instantly.
            </p>
          </div>
        )}

        {/* --- PROJECTS TAB --- */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Independent Projects</span>
              <button
                onClick={addProject}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>

            {data.projects.length === 0 && (
              <p className="text-xs italic text-slate-400 text-center py-6">No project details included yet. Click Add Project to start.</p>
            )}

            <div className="space-y-4">
              {data.projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-3 relative shadow">
                  <button
                    onClick={() => removeProject(proj.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CloudScale Telemetry"
                        value={proj.name}
                        onChange={(e) => updateProjectItem(proj.id, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Technologies / Stack</label>
                      <input
                        type="text"
                        placeholder="e.g. Go, Kubernetes, Recharts"
                        value={proj.technologies}
                        onChange={(e) => updateProjectItem(proj.id, "technologies", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Project Link / Source Code</label>
                    <input
                      type="text"
                      placeholder="e.g. github.com/user/project"
                      value={proj.link}
                      onChange={(e) => updateProjectItem(proj.id, "link", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Project Description</label>
                    <textarea
                      placeholder="Key achievements or what the project does. Keep it concise."
                      value={proj.description}
                      onChange={(e) => updateProjectItem(proj.id, "description", e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CERTIFICATIONS TAB --- */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Professional Certifications</span>
              <button
                onClick={addCertification}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Credential
              </button>
            </div>

            {data.certifications.length === 0 && (
              <p className="text-xs italic text-slate-400 text-center py-6">No credentials included yet. Click Add Credential to start.</p>
            )}

            <div className="space-y-3">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg relative flex items-center gap-3 shadow">
                  <button
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-3 gap-2 flex-grow pt-2">
                    <div className="col-span-1">
                      <input
                        type="text"
                        placeholder="Certificate Name"
                        value={cert.name}
                        onChange={(e) => updateCertificationItem(cert.id, "name", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Issuer (e.g. AWS)"
                        value={cert.issuer}
                        onChange={(e) => updateCertificationItem(cert.id, "issuer", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Date (e.g. 2024-01)"
                        value={cert.date}
                        onChange={(e) => updateCertificationItem(cert.id, "date", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- LANGUAGES TAB --- */}
        {activeTab === "languages" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Languages Proficiency</span>
              <button
                onClick={addLanguage}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Language
              </button>
            </div>

            {data.languages.length === 0 && (
              <p className="text-xs italic text-slate-400 text-center py-6">No languages included yet. Click Add Language to start.</p>
            )}

            <div className="space-y-3">
              {data.languages.map((lang) => (
                <div key={lang.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg relative flex items-center gap-3 shadow">
                  <button
                    onClick={() => removeLanguage(lang.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 flex-grow pt-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Language Name"
                        value={lang.name}
                        onChange={(e) => updateLanguageItem(lang.id, "name", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateLanguageItem(lang.id, "proficiency", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300"
                      >
                        <option value="Native">Native Speaker</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional Working</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
