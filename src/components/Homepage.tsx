import React, { useState, useEffect } from "react";
import { 
  FileText, ShieldCheck, Zap, Award, Mail, ChevronRight, LogIn, LogOut, LayoutDashboard,
  CheckCircle2, ArrowRight, Plus, Upload, Download, Sparkles, Sliders, Eye, Target,
  HelpCircle, Check, Briefcase
} from "lucide-react";
import { motion } from "motion/react";
import { CVData, CVRecord, DesignConfig, TemplateId } from "../types";
import { UserDropdown } from "./UserDropdown";
import { ResumeUpload } from "./common/ResumeUpload";
import { Header } from "./Header";

interface HomepageProps {
  currentUser: { email: string; displayName: string; uid: string } | null;
  onStartBuilding: (templateId?: TemplateId, initialTab?: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDashboard: () => void;
  onOpenSettings?: () => void;
  onOpenAIImport?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onNavigateATSChecker?: () => void;
  onNavigateJobMatch?: () => void;
  onOpenAnalyticsPreferences?: () => void;
  onImportResume?: (parsedCV: CVData, title: string) => void;
  userCVs?: CVRecord[];
  onSelectSavedCV?: (cvRecord: { data: CVData; design: DesignConfig; title: string; id?: string }) => void;
}

export function Homepage({ 
  currentUser, 
  onStartBuilding, 
  onSignIn, 
  onSignOut, 
  onOpenDashboard,
  onOpenSettings,
  onOpenAIImport,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateATSChecker,
  onNavigateJobMatch,
  onOpenAnalyticsPreferences,
  onImportResume,
  userCVs = [],
  onSelectSavedCV
}: HomepageProps) {
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<TemplateId>("modern");

  // Professional templates with clean descriptions
  const templates: { 
    id: TemplateId; 
    name: string; 
    category: string;
    desc: string; 
    color: string; 
    recommendedFor: string;
    features: string[];
  }[] = [
    { 
      id: "modern", 
      name: "Modern Elite", 
      category: "Tech & Product",
      desc: "Balanced two-column layout with clean visual hierarchy, ideal for software engineers, product managers, and data analysts.",
      color: "bg-indigo-600",
      recommendedFor: "Technology, Product & Engineering",
      features: ["Two-column structured layout", "Prominent skills categorization", "Designed for ATS Compatibility"]
    },
    { 
      id: "executive", 
      name: "Executive Suite", 
      category: "Leadership & Corporate",
      desc: "Traditional single-column layout with refined typography for senior leaders, finance, operations, and consulting.",
      color: "bg-blue-600",
      recommendedFor: "Executives, Finance, Consulting & Operations",
      features: ["Single-column chronological layout", "Executive summary spotlight", "Standard corporate readability"]
    },
    { 
      id: "minimalist", 
      name: "Minimal Clean", 
      category: "Design & Creative",
      desc: "Spacious layout with generous whitespace and understated styling for designers, architects, and researchers.",
      color: "bg-emerald-600",
      recommendedFor: "Design, UI/UX, Research & Creative Roles",
      features: ["Maximized negative space", "Subtle divider structure", "Clean portfolio & link presentation"]
    },
    { 
      id: "creative", 
      name: "Creative Edge", 
      category: "Marketing & Media",
      desc: "Structured layout with a dedicated sidebar accent for marketers, content strategists, and media professionals.",
      color: "bg-purple-600",
      recommendedFor: "Marketing, Communications & Media",
      features: ["Distinctive sidebar accent", "Project showcase spotlight", "Compact credential badges"]
    },
  ];

  const currentTpl = templates.find(t => t.id === selectedTemplateTab) || templates[0];

  const handleSuccessfulUpload = (parsedCV: CVData, title: string) => {
    if (onImportResume) {
      onImportResume(parsedCV, title);
    } else {
      onStartBuilding();
    }
  };

  // Smooth scroll to templates if hash exists
  useEffect(() => {
    if (window.location.hash === "#templates") {
      setTimeout(() => {
        document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Header
        currentRoute="home"
        currentUser={currentUser}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onNavigateBuilder={() => onStartBuilding()}
        onNavigateATSChecker={() => onNavigateATSChecker?.()}
        onNavigateJobMatch={() => onNavigateJobMatch?.()}
        onNavigateTemplates={() => {
          const el = document.getElementById("templates");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onOpenDashboard={onOpenDashboard}
        onOpenSettings={onOpenSettings}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onNavigatePrivacy={onNavigatePrivacy}
        onNavigateTerms={onNavigateTerms}
        primaryCtaLabel="Create New CV"
        onPrimaryCta={() => onStartBuilding()}
      />

      {/* 2. Hero Section with Prominent Resume Upload */}
      <section className="relative px-4 md:px-12 pt-7 md:pt-9 pb-8 md:pb-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        
        {/* Subtle Trust Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-xs font-medium mb-3.5 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Free CV Builder &bull; ATS Checker &bull; Job Match</span>
        </motion.div>

        {/* Required H1 */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15] max-w-3xl"
        >
          Build, Check &amp; Improve Your CV with AI
        </motion.h1>

        {/* Required Supporting Text */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-slate-400 text-sm md:text-base mt-2.5 max-w-2xl leading-relaxed"
        >
          Create a professional CV or upload your resume to check ATS compatibility, match jobs, and improve it with AI.
        </motion.p>

        {/* Primary Action Zone: Shared Reusable Resume Upload Component */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-2xl mt-5"
        >
          <ResumeUpload
            onUploadSuccess={handleSuccessfulUpload}
            currentUser={currentUser}
            userCVs={userCVs}
            onSelectSavedCV={onSelectSavedCV}
            onSignInPrompt={onSignIn}
            variant="hero"
            title="Drop your resume here"
            subtitle="PDF, DOCX, DOC or TXT • Max 10MB"
            primaryActionLabel="Choose File"
            showCurrentCVBadge={false}
          />
        </motion.div>

        {/* Secondary CTA: Create New CV */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400"
        >
          <span>Starting from scratch?</span>
          <button
            onClick={() => onStartBuilding()}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer underline underline-offset-4"
            id="homepage_hero_create_blank_btn"
          >
            <span>Create New CV with Blank Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </section>

      {/* 3. The 3 Core Tools */}
      <section className="px-4 md:px-12 py-10 md:py-14 bg-slate-900/40 border-y border-slate-850">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">ProCVMaker Suite</span>
            <h2 className="text-2xl font-bold text-white mt-1">3 Essential Tools for Job Applications</h2>
            <p className="text-xs text-slate-400 mt-1">
              Everything you need to create, test, and tailor your resume for hiring teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tool 1: Build CV */}
            <div className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Build CV</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Design professional, ATS-friendly resumes using proven layouts with real-time typography controls and free PDF export.
                </p>
              </div>

              <button
                onClick={() => onStartBuilding()}
                className="mt-6 w-full py-2.5 px-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500/30 hover:border-transparent"
                id="homepage_core_tool_builder_btn"
              >
                <span>Launch CV Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tool 2: Check ATS */}
            <div className="bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Check ATS</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scan your CV against applicant tracking system rules. Spot machine-readability issues, passive phrasing, and section errors.
                </p>
              </div>

              <button
                onClick={() => onNavigateATSChecker?.()}
                className="mt-6 w-full py-2.5 px-4 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-teal-500/30 hover:border-transparent"
                id="homepage_core_tool_ats_btn"
              >
                <span>Open ATS Checker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tool 3: Match Job */}
            <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Match Job</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare your resume against any job description to discover matching skills, spot missing qualifications, and tailor bullet points.
                </p>
              </div>

              <button
                onClick={() => onNavigateJobMatch?.()}
                className="mt-6 w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/30 hover:border-transparent"
                id="homepage_core_tool_job_match_btn"
              >
                <span>Try Job Match</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Simple 3-Step "How It Works" */}
      <section id="how-it-works" className="px-4 md:px-12 py-14 md:py-18 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Simple Process</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            How to Build Your CV with ProCVMaker
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            From upload to a polished PDF ready for job applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center mb-3.5 border border-indigo-500/30">
              1
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">Upload or Pick a Template</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Upload your existing document (PDF/DOCX) to autofill all fields, or select a clean starter template.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center mb-3.5 border border-indigo-500/30">
              2
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">Edit &amp; Check ATS Score</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Customize your work experience, bullet points, and skills with real-time A4 preview and instant ATS audits.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center mb-3.5 border border-indigo-500/30">
              3
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">Export ATS-Friendly PDF</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Download clean, high-resolution vector PDFs with standard machine-readable text layers and zero watermarks.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Curated Templates Showcase */}
      <section id="templates" className="px-4 md:px-12 py-14 md:py-18 bg-slate-900/30 border-t border-slate-850">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Templates</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
              Choose Your CV Layout
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Every design is crafted for clear visual hierarchy and automated parser readability.
            </p>
          </div>

          {/* Template Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplateTab(tpl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTemplateTab === tpl.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>

          {/* Active Template Spotlight Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4 text-left">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{currentTpl.category}</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{currentTpl.name}</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {currentTpl.desc}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Roles</span>
                <span className="text-xs font-semibold text-white">{currentTpl.recommendedFor}</span>
              </div>

              <div className="space-y-1.5">
                {currentTpl.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={() => onStartBuilding(currentTpl.id)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  id={`homepage_tpl_select_${currentTpl.id}`}
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Template Mini Preview */}
            <div className="lg:col-span-6 bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 flex justify-center">
              <div className="w-full max-w-sm bg-white text-slate-900 rounded-lg p-5 shadow-lg text-[10px] space-y-2.5 font-sans border border-slate-200">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xs text-slate-900">ALEX MORGAN</p>
                    <p className="text-[9px] font-medium text-indigo-600">Senior Software Engineer</p>
                    <p className="text-[8px] text-slate-500">alex.morgan@example.com &bull; San Francisco, CA</p>
                  </div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                    A4
                  </span>
                </div>

                <div>
                  <p className="font-bold text-[9px] text-slate-900 uppercase tracking-wider mb-0.5">Experience</p>
                  <div className="space-y-0.5">
                    <div className="flex justify-between font-bold text-[8px] text-slate-800">
                      <span>Platform Engineer &bull; TechCorp</span>
                      <span className="text-slate-400 font-normal">2021–Present</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-tight">
                      Designed and maintained scalable cloud services handling high concurrency with 99.9% uptime.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[9px] text-slate-900 uppercase tracking-wider mb-0.5">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {["TypeScript", "React", "Node.js", "PostgreSQL", "Cloud Architecture"].map((s, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[8px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Benefits & Core Features */}
      <section id="features" className="px-4 md:px-12 py-14 md:py-18 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Key Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            Designed for Speed and Clear Hiring Results
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl text-left space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">ATS-Friendly Layouts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard headings and clean typography hierarchies that applicant tracking systems parse smoothly.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl text-left space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">Live Instant Preview</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjust section ordering, fonts, colors, and margins with an accurate real-time A4 sheet rendering.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl text-left space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">Free PDF Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download clean, vector-sharp PDF documents ready for corporate job applications without watermarks.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl text-left space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">Fast Document Import</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your previous PDF or Word resume to automatically extract your experience into our editor.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section className="px-4 md:px-12 py-14 md:py-18 bg-slate-900/40 border-t border-slate-850">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>What makes a resume ATS-friendly?</span>
              </h3>
              <p className="text-slate-400 leading-relaxed pl-6">
                An ATS-friendly resume uses standard section titles (Experience, Education, Skills), simple font styling, machine-readable text layers, and avoids complex tables or graphics that confuse parsing software.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Can I upload my existing PDF or Word resume?</span>
              </h3>
              <p className="text-slate-400 leading-relaxed pl-6">
                Yes. Drop your file into the upload box on this page, and ProCVMaker will automatically extract your contact details, work history, skills, and education directly into our interactive editor.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Is ProCVMaker free to use?</span>
              </h3>
              <p className="text-slate-400 leading-relaxed pl-6">
                Yes. You can build resumes, run ATS audits, match against job descriptions, and export high-resolution PDFs without any hidden fees or watermarks.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>How does Resume Job Match work?</span>
              </h3>
              <p className="text-slate-400 leading-relaxed pl-6">
                Our Job Match tool compares your resume against the text of any job posting to identify matching skills, highlight missing keywords, and suggest tailored bullet point improvements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 px-4 md:px-12 py-10 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-xs shrink-0">
              AI
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-200">ProCVMaker</p>
              <p className="text-[11px] text-slate-400 mt-0.5">AI CV Builder &amp; ATS Resume Checker</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onStartBuilding();
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer text-xs"
              id="footer_builder_link"
            >
              Resume Builder
            </a>
            <a
              href="/ats-checker"
              onClick={(e) => {
                e.preventDefault();
                onNavigateATSChecker?.();
              }}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              id="footer_ats_link"
            >
              Free ATS Resume Checker
            </a>
            <a
              href="/job-match"
              onClick={(e) => {
                e.preventDefault();
                onNavigateJobMatch?.();
              }}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              id="footer_job_match_link"
            >
              Job Match
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePrivacy?.();
              }}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              id="footer_privacy_link"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTerms?.();
              }}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              id="footer_terms_link"
            >
              Terms of Service
            </a>
            {onOpenAnalyticsPreferences && (
              <button
                type="button"
                onClick={onOpenAnalyticsPreferences}
                className="text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
                id="footer_analytics_prefs_btn"
              >
                Analytics Preferences
              </button>
            )}
            
            <a 
              href="mailto:asadkhr39@gmail.com?subject=Inquiry regarding ProCVMaker"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition cursor-pointer select-none font-semibold text-xs ml-2"
              id="homepage_contact_link"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>&copy; 2026 ProCVMaker. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
