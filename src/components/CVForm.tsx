import React, { useState } from "react";
import { 
  User, Briefcase, GraduationCap, Code, FileText, Award, 
  Languages, Plus, Trash2, Palette, Sparkles, SlidersHorizontal, Loader2, Check,
  ExternalLink, Layers, ChevronRight, ShieldCheck
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
  onCheckATS?: () => void;
}

export const CVForm: React.FC<CVFormProps> = ({ 
  data, 
  onChange, 
  design, 
  onDesignChange, 
  currentUser,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onCheckATS
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>("design");
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = onActiveTabChange !== undefined ? onActiveTabChange : setLocalActiveTab;

  const [skillInput, setSkillInput] = useState<string>("");
  
  // Loading states for smart assistance features
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs navigation config
  const tabs = [
    { id: "design", label: "Template & Style", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: "personal", label: "Personal Info", icon: <User className="w-3.5 h-3.5" /> },
    { id: "summary", label: "Summary", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "experience", label: "Experience", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "education", label: "Education", icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: "skills", label: "Skills", icon: <Code className="w-3.5 h-3.5" /> },
    { id: "projects", label: "Projects", icon: <Award className="w-3.5 h-3.5" /> },
    { id: "certifications", label: "Certifications", icon: <Award className="w-3.5 h-3.5" /> },
    { id: "languages", label: "Languages", icon: <Languages className="w-3.5 h-3.5" /> },
  ];

  // Helper to trigger personal state updates
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

  // Smart feature 1: Generate Professional Summary
  const handleAutoGenerateSummary = async () => {
    const jobTitle = data.personal.jobTitle;
    if (!jobTitle) {
      setErrorMsg("Please enter a Target Job Title in 'Personal Info' first so we can tailor the summary.");
      setActiveTab("personal");
      return;
    }

    setIsGeneratingSummary(true);
    setErrorMsg(null);

    try {
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
        setSuccessMsg("Generated professional summary tailored to your experience.");

        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid), {
            cvData: updatedData,
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "Summary Generation",
              description: `Generated summary for "${updatedData.personal.jobTitle || "Resume"}"`,
              details: resData.summary.substring(0, 150) + "..."
            })
          }, { merge: true }).catch(console.error);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while generating summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Smart feature 2: Enhance Experience Bullets
  const handleEnhanceExperience = async (id: string, currentText: string) => {
    if (!currentText.trim()) {
      setErrorMsg("Please enter some bullet points or notes first before formatting.");
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
        throw new Error(resData.error || "Failed to enhance text");
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

        if (currentUser) {
          const expItem = data.experience.find(exp => exp.id === id);
          setDoc(doc(db, "users", currentUser.uid), {
            cvData: updatedData,
            aiGenerations: arrayUnion({
              timestamp: new Date().toISOString(),
              type: "Bullet Point Enhancement",
              description: `Enhanced bullets for "${expItem?.position || "Role"}" at "${expItem?.company || "Company"}"`,
              details: resData.polishedText.substring(0, 150) + "..."
            })
          }, { merge: true }).catch(console.error);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to enhance bullet points.");
    } finally {
      setPolishingId(null);
    }
  };

  // Smart feature 3: Suggest Skills
  const handleSuggestSkills = async () => {
    const jobTitle = data.personal.jobTitle;
    if (!jobTitle) {
      setErrorMsg("Please enter a Target Job Title in 'Personal Info' first to find relevant skills.");
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
        throw new Error(resData.error || "Failed to suggest skills");
      }

      const freshSkills = resData.skills || [];
      const mergedSkills = Array.from(new Set([...data.skills, ...freshSkills]));
      
      let mergedCerts = [...data.certifications];
      const recCerts = resData.certifications || [];
      recCerts.forEach((certName: string) => {
        const alreadyHas = data.certifications.some(c => c.name.toLowerCase() === certName.toLowerCase());
        if (!alreadyHas) {
          mergedCerts.push({
            id: `cert-${Date.now()}-${Math.random()}`,
            name: certName,
            issuer: "Recommended Certificate",
            date: "Recent"
          });
        }
      });

      const updatedData = {
        ...data,
        skills: mergedSkills,
        certifications: mergedCerts
      };

      onChange(updatedData);
      setSuccessMsg(`Added ${freshSkills.length} relevant skill keywords.`);

      if (currentUser) {
        setDoc(doc(db, "users", currentUser.uid), {
          cvData: updatedData,
          aiGenerations: arrayUnion({
            timestamp: new Date().toISOString(),
            type: "Skill Suggestions",
            description: `Suggested skills for "${jobTitle}"`,
            details: freshSkills.slice(0, 5).join(", ")
          })
        }, { merge: true }).catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not suggest skills.");
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  // CRUD helpers: Experience
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

  // CRUD helpers: Education
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
    { label: "Indigo", value: "#4f46e5" },
    { label: "Corporate Blue", value: "#2563eb" },
    { label: "Emerald", value: "#059669" },
    { label: "Crimson", value: "#e11d48" },
    { label: "Violet", value: "#7c3aed" },
    { label: "Slate / Charcoal", value: "#334155" },
    { label: "Amber", value: "#d97706" }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Resume Builder</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Customize content, layout, and visual formatting</p>
        </div>
        {onCheckATS && (
          <button
            onClick={onCheckATS}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-teal-300 border border-slate-800 hover:border-teal-700/50 rounded-lg text-xs font-semibold tracking-tight shadow-sm cursor-pointer transition flex items-center gap-1.5 shrink-0"
            title="Run ATS Analysis on current resume draft"
            id="cvform_check_ats_btn"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>ATS Audit</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex bg-slate-950 px-3 py-2 overflow-x-auto gap-1 border-b border-slate-800 shrink-0 select-none scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form Content Area */}
      <div className="p-5 flex-grow overflow-y-auto space-y-5">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* --- TEMPLATE & STYLE TAB --- */}
        {activeTab === "design" && (
          <div className="space-y-6">
            
            {/* Master Template Selector */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                <span>Resume Template</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "modern", name: "Modern Elite", desc: "Two-column structured layout for tech & product." },
                  { id: "executive", name: "Executive Suite", desc: "Classic single-column serif for corporate & leadership." },
                  { id: "minimalist", name: "Clean Minimalist", desc: "Maximum whitespace with clean grid accents." },
                  { id: "creative", name: "Creative Brand", desc: "Prominent sidebar accent for design & marketing." }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => onDesignChange({ ...design, templateId: tpl.id as TemplateId })}
                    className={`p-3 text-left rounded-xl border transition cursor-pointer relative ${
                      design.templateId === tpl.id 
                        ? "bg-indigo-600/10 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30" 
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs">{tpl.name}</span>
                      {design.templateId === tpl.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-normal">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Color */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 block">
                Primary Accent Color
              </h3>
              <div className="flex flex-wrap items-center gap-2.5">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onDesignChange({ ...design, themeColor: preset.value })}
                    className={`w-7 h-7 rounded-full border transition relative cursor-pointer flex items-center justify-center ${
                      design.themeColor === preset.value ? "border-white ring-2 ring-indigo-500/50 scale-110" : "border-slate-700 hover:scale-105"
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
                <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                  <input
                    type="color"
                    value={design.themeColor}
                    onChange={(e) => onDesignChange({ ...design, themeColor: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-slate-950 border border-slate-800"
                    title="Choose custom color"
                  />
                  <span className="text-[11px] font-mono text-slate-400">{design.themeColor}</span>
                </div>
              </div>
            </div>

            {/* Typography & Spacing */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Typography & Spacing
              </h3>
              
              {/* Font Family */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Font Style</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "sans", name: "Modern Sans" },
                    { id: "serif", name: "Classic Serif" },
                    { id: "mono", name: "Technical Mono" },
                    { id: "grotesk", name: "Clean Display" }
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => onDesignChange({ ...design, fontFamily: font.id as any })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border cursor-pointer transition ${
                        design.fontFamily === font.id 
                          ? "bg-slate-800 text-white border-indigo-500 shadow-sm" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing Select */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Page Density & Margins</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", name: "Compact (1 Page Fit)" },
                    { id: "normal", name: "Standard (Balanced)" },
                    { id: "relaxed", name: "Relaxed (Spacious)" }
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => onDesignChange({ ...design, spacing: sp.id as any })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border cursor-pointer transition ${
                        design.spacing === sp.id 
                          ? "bg-slate-800 text-white border-indigo-500 shadow-sm" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {sp.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Visibility Controls */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 block">
                Visible Sections
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { key: "showExperienceSection", label: "Work Experience" },
                  { key: "showEducationSection", label: "Education & Academics" },
                  { key: "showProjectsSection", label: "Notable Projects" },
                  { key: "showCertificationsSection", label: "Certifications & Credentials" },
                  { key: "showLanguagesSection", label: "Languages" }
                ].map((cfg) => (
                  <label key={cfg.key} className="flex justify-between items-center cursor-pointer select-none py-0.5">
                    <span className="text-slate-300 font-medium">{cfg.label}</span>
                    <input
                      type="checkbox"
                      checked={(design as any)[cfg.key]}
                      onChange={(e) => onDesignChange({ ...design, [cfg.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
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
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={data.personal.fullName}
                onChange={(e) => updatePersonal("fullName", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Full Stack Engineer"
                value={data.personal.jobTitle}
                onChange={(e) => updatePersonal("jobTitle", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="alex.morgan@example.com"
                  value={data.personal.email}
                  onChange={(e) => updatePersonal("email", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={data.personal.phone}
                  onChange={(e) => updatePersonal("phone", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA (or Remote)"
                value={data.personal.location}
                onChange={(e) => updatePersonal("location", e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/..."
                  value={data.personal.linkedin}
                  onChange={(e) => updatePersonal("linkedin", e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition truncate"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">GitHub / Portfolio</label>
                <input
                  type="text"
                  placeholder="github.com/..."
                  value={data.personal.github}
                  onChange={(e) => updatePersonal("github", e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition truncate"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Personal Website</label>
                <input
                  type="text"
                  placeholder="alexmorgan.dev"
                  value={data.personal.website}
                  onChange={(e) => updatePersonal("website", e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition truncate"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- SUMMARY TAB --- */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 block">Executive Summary</label>
              
              <button
                onClick={handleAutoGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Write Summary</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={data.summary}
              onChange={handleSummaryChange}
              rows={6}
              placeholder="Highlight your key achievements, leadership experience, core technical capabilities, and primary career goals. Aim for 3-4 impactful sentences."
              className="w-full p-3 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed transition"
            />
            
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-850 text-xs text-slate-400 leading-relaxed">
              💡 <span className="font-semibold text-slate-300">Pro Tip:</span> Fill in your target job title in Personal Info and at least one role in Experience, then click <span className="text-indigo-400 font-medium">Auto-Write Summary</span> to generate an ATS-tailored statement.
            </div>
          </div>
        )}

        {/* --- EXPERIENCE TAB --- */}
        {activeTab === "experience" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Work Experience</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Chronological career history</p>
              </div>
              <button
                onClick={addExperience}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>

            {data.experience.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <Briefcase className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No work experience added yet.</p>
                <button
                  onClick={addExperience}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add your first position
                </button>
              </div>
            )}

            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={exp.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5 relative shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-slate-300">Position #{data.experience.length - index}</span>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remove Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={exp.position}
                        onChange={(e) => updateExperienceItem(exp.id, "position", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Company / Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={exp.company}
                        onChange={(e) => updateExperienceItem(exp.id, "company", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={exp.location}
                        onChange={(e) => updateExperienceItem(exp.id, "location", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Start Date</label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperienceItem(exp.id, "startDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">End Date</label>
                        <input
                          type="month"
                          value={exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => updateExperienceItem(exp.id, "endDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperienceItem(exp.id, "current", e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Currently working here</span>
                    </label>

                    <button
                      onClick={() => handleEnhanceExperience(exp.id, exp.description)}
                      disabled={polishingId === exp.id}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 disabled:opacity-50 border border-indigo-500/25 rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      {polishingId === exp.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Formatting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Enhance Bullets</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Key Responsibilities & Achievements (One per line)</label>
                    <textarea
                      placeholder="• Led the migration of microservices architecture resulting in 40% latency reduction
• Mentored a team of 6 engineers and streamlined CI/CD deployment pipelines"
                      value={exp.description}
                      onChange={(e) => updateExperienceItem(exp.id, "description", e.target.value)}
                      rows={4}
                      className="w-full p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- EDUCATION TAB --- */}
        {activeTab === "education" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Education</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Degrees and academic qualifications</p>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {data.education.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <GraduationCap className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No education entries added yet.</p>
                <button
                  onClick={addEducation}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add qualification
                </button>
              </div>
            )}

            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={edu.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5 relative shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-slate-300">Degree #{data.education.length - index}</span>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">University / Institution</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={edu.school}
                        onChange={(e) => updateEducationItem(edu.id, "school", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Degree</label>
                      <input
                        type="text"
                        placeholder="e.g. Bachelor of Science (B.S.)"
                        value={edu.degree}
                        onChange={(e) => updateEducationItem(edu.id, "degree", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Major / Field of Study</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={edu.field}
                        onChange={(e) => updateEducationItem(edu.id, "field", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Start Date</label>
                        <input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) => updateEducationItem(edu.id, "startDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Graduation Date</label>
                        <input
                          type="month"
                          value={edu.endDate}
                          disabled={edu.current}
                          onChange={(e) => updateEducationItem(edu.id, "endDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={edu.current}
                        onChange={(e) => updateEducationItem(edu.id, "current", e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Currently studying here</span>
                    </label>
                    <div>
                      <input
                        type="text"
                        placeholder="Location (e.g. Stanford, CA)"
                        value={edu.location}
                        onChange={(e) => updateEducationItem(edu.id, "location", e.target.value)}
                        className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Academic Honors / Activities (Optional)</label>
                    <textarea
                      placeholder="e.g. GPA 3.9/4.0, Dean's Honors List, Relevant Coursework: Distributed Systems, Machine Learning"
                      value={edu.notes}
                      onChange={(e) => updateEducationItem(edu.id, "notes", e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Skills & Technologies</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Core competencies and domain expertise</p>
              </div>
              
              <button
                onClick={handleSuggestSkills}
                disabled={isSuggestingSkills}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                {isSuggestingSkills ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Finding Skills...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggest Skills</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick add form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a skill (e.g. TypeScript, React, Docker) & press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-grow px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Add
              </button>
            </form>

            {/* Badges container */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl min-h-[140px]">
              {data.skills.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No skills added yet. Type above or click Suggest Skills.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button 
                        type="button" 
                        onClick={() => removeSkill(index)} 
                        className="text-slate-400 hover:text-rose-400 font-bold transition shrink-0 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-850 text-xs text-slate-400 leading-relaxed">
              💡 <span className="font-semibold text-slate-300">Pro Tip:</span> Click <span className="text-indigo-400 font-medium">Suggest Skills</span> to automatically populate industry-standard keywords aligned with your target job role.
            </div>
          </div>
        )}

        {/* --- PROJECTS TAB --- */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Key Projects</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Showcase open-source, client, or personal work</p>
              </div>
              <button
                onClick={addProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {data.projects.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <Award className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No projects added yet.</p>
                <button
                  onClick={addProject}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add project showcase
                </button>
              </div>
            )}

            <div className="space-y-4">
              {data.projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 relative shadow-sm">
                  <button
                    onClick={() => removeProject(proj.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Remove Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Cache Engine"
                        value={proj.name}
                        onChange={(e) => updateProjectItem(proj.id, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Tech Stack</label>
                      <input
                        type="text"
                        placeholder="e.g. Go, Redis, Docker, Prometheus"
                        value={proj.technologies}
                        onChange={(e) => updateProjectItem(proj.id, "technologies", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Project Link / Repository (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. github.com/username/project"
                      value={proj.link}
                      onChange={(e) => updateProjectItem(proj.id, "link", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Description & Impact</label>
                    <textarea
                      placeholder="Brief description of the problem solved, architectural approach, and quantifiable results achieved."
                      value={proj.description}
                      onChange={(e) => updateProjectItem(proj.id, "description", e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
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
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Certifications</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Professional credentials and licenses</p>
              </div>
              <button
                onClick={addCertification}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Credential
              </button>
            </div>

            {data.certifications.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <Award className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No certifications added yet.</p>
                <button
                  onClick={addCertification}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add certification
                </button>
              </div>
            )}

            <div className="space-y-3">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl relative shadow-sm">
                  <button
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-3 gap-2.5 pr-6">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Certification Name</label>
                      <input
                        type="text"
                        placeholder="e.g. AWS Solutions Architect"
                        value={cert.name}
                        onChange={(e) => updateCertificationItem(cert.id, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Issuing Authority</label>
                      <input
                        type="text"
                        placeholder="e.g. Amazon Web Services"
                        value={cert.issuer}
                        onChange={(e) => updateCertificationItem(cert.id, "issuer", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Date / Validity</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024 - 2027"
                        value={cert.date}
                        onChange={(e) => updateCertificationItem(cert.id, "date", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Languages</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Language proficiencies and fluency</p>
              </div>
              <button
                onClick={addLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Language
              </button>
            </div>

            {data.languages.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <Languages className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No languages added yet.</p>
                <button
                  onClick={addLanguage}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add language
                </button>
              </div>
            )}

            <div className="space-y-3">
              {data.languages.map((lang) => (
                <div key={lang.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl relative shadow-sm">
                  <button
                    onClick={() => removeLanguage(lang.id)}
                    className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Language</label>
                      <input
                        type="text"
                        placeholder="e.g. English, Spanish, German"
                        value={lang.name}
                        onChange={(e) => updateLanguageItem(lang.id, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Proficiency Level</label>
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateLanguageItem(lang.id, "proficiency", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Native">Native / Bilingual</option>
                        <option value="Fluent">Fluent (C1/C2)</option>
                        <option value="Professional">Professional Working (B2)</option>
                        <option value="Conversational">Conversational (B1)</option>
                        <option value="Basic">Elementary (A1/A2)</option>
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
