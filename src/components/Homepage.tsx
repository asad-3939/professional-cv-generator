import React, { useState } from "react";
import { 
  FileText, ShieldCheck, Zap, Award, Mail, ChevronRight, LogIn, LogOut, LayoutDashboard,
  CheckCircle2, ArrowRight, Plus, Upload, Download, Sparkles, Sliders, Eye, Palette
} from "lucide-react";
import { motion } from "motion/react";
import { TemplateId } from "../types";
import { UserDropdown } from "./UserDropdown";

interface HomepageProps {
  currentUser: { email: string; displayName: string; uid: string } | null;
  onStartBuilding: (templateId?: TemplateId, initialTab?: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDashboard: () => void;
  onOpenSettings?: () => void;
  onOpenAIImport: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
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
  onNavigateTerms
}: HomepageProps) {
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<TemplateId>("modern");

  // Curated professional templates with clear positioning
  const templates: { 
    id: TemplateId; 
    name: string; 
    category: string;
    desc: string; 
    color: string; 
    accentHex: string;
    recommendedFor: string;
    features: string[];
  }[] = [
    { 
      id: "modern", 
      name: "Modern Elite", 
      category: "Tech & Product",
      desc: "Balanced two-column layout optimized for software engineers, product managers, and data analysts.",
      color: "bg-indigo-600",
      accentHex: "#4f46e5",
      recommendedFor: "Technology, Product & Engineering",
      features: ["Two-column structured layout", "Prominent skills breakdown", "High ATS compatibility score"]
    },
    { 
      id: "executive", 
      name: "Executive Suite", 
      category: "Leadership & Corporate",
      desc: "Traditional single-column layout with serif typography for senior leaders, finance, operations, and legal.",
      color: "bg-blue-600",
      accentHex: "#2563eb",
      recommendedFor: "Executives, Finance, Consulting & Legal",
      features: ["Single-column chronological layout", "Executive summary focus", "Universal recruiter standard"]
    },
    { 
      id: "minimalist", 
      name: "Minimal Clean", 
      category: "Design & Creative",
      desc: "Spacious layout with clean lines and generous whitespace for designers, architects, and researchers.",
      color: "bg-emerald-600",
      accentHex: "#059669",
      recommendedFor: "Design, UI/UX, Architecture & Research",
      features: ["Maximized negative space", "Subtle grid structure", "Portfolio & link integration"]
    },
    { 
      id: "creative", 
      name: "Creative Edge", 
      category: "Marketing & Media",
      desc: "Dynamic layout with distinct accent sidebar for marketers, content strategists, and media professionals.",
      color: "bg-purple-600",
      accentHex: "#7c3aed",
      recommendedFor: "Marketing, Media, Sales & Communications",
      features: ["Distinctive sidebar accent", "Project showcase spotlight", "Compact credential badges"]
    },
  ];

  const currentTpl = templates.find(t => t.id === selectedTemplateTab) || templates[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* 1. Header Navigation */}
      <header className="h-16 md:h-20 border-b border-slate-850 px-4 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-xl shadow-indigo-500/15 shrink-0">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">AI Professional CV Builder</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Automatic PDF formatter and resume writer</p>
          </div>
        </div>

        {/* Quick Anchor Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
        </nav>

        {/* User Account / Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {currentUser ? (
            <UserDropdown
              currentUser={currentUser}
              onOpenDashboard={onOpenDashboard}
              onOpenSettings={onOpenSettings || onOpenDashboard}
              onSignOut={onSignOut}
              onNavigatePrivacy={onNavigatePrivacy}
              onNavigateTerms={onNavigateTerms}
            />
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl text-xs font-semibold transition cursor-pointer border border-transparent hover:border-slate-800"
              id="homepage_signin_btn"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => onStartBuilding()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-indigo-600/20 cursor-pointer"
            id="homepage_top_cta_btn"
          >
            <span>Create My CV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative px-4 md:px-12 pt-12 md:pt-20 pb-16 md:pb-24 max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Trust Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-xs font-medium mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>ATS-Compliant Formatting • 100% Free PDF Export</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-3xl"
        >
          Build a Job-Winning Resume in Minutes
        </motion.h1>

        {/* Subtitle Value Proposition */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-slate-400 text-sm md:text-base mt-5 max-w-2xl leading-relaxed"
        >
          Clean, recruiter-approved CV templates designed to pass automated hiring systems. Customize sections, preview live changes, and export print-ready PDFs without watermarks.
        </motion.p>

        {/* Primary Call-to-Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => onStartBuilding()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            id="homepage_hero_create_btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create My CV</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onOpenAIImport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-850 hover:border-slate-750 rounded-xl text-sm font-semibold transition cursor-pointer"
            id="homepage_hero_import_btn"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Import Existing Resume</span>
          </button>
        </motion.div>

        {/* Live Visual Showcase Preview Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700" />
              <span className="w-3 h-3 rounded-full bg-slate-700" />
              <span className="w-3 h-3 rounded-full bg-slate-700" />
              <span className="text-xs font-semibold text-slate-400 ml-2">Interactive Live Editor Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">ATS Verified</span>
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Standard A4 Format</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Mockup Summary */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Executive Overview</span>
                <h3 className="text-lg font-bold text-white mt-1">Senior Software Engineer</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Specialized in full-stack architecture, distributed systems, and modern web application development.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-850 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Real-time typography & margin controls</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Chronological work history & metrics formatting</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Single-click high-resolution PDF download</span>
                </div>
              </div>

              <button
                onClick={() => onStartBuilding("modern")}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-bold transition cursor-pointer border border-slate-700"
              >
                <span>Edit in Modern Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Mini Document Rendering */}
            <div className="md:col-span-7 bg-white text-slate-900 rounded-xl p-5 md:p-6 shadow-md select-none border border-slate-200">
              <div className="border-b border-slate-200 pb-3 mb-3 flex justify-between items-start">
                <div>
                  <h4 className="text-base font-extrabold text-slate-950 tracking-tight">ALEXANDER MORGAN</h4>
                  <p className="text-xs font-semibold text-indigo-600">Lead Full-Stack Engineer</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">alex.morgan@example.com • +1 (555) 234-5678 • San Francisco, CA</p>
                </div>
                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">A4 Layout</span>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">Professional Experience</h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline font-bold text-slate-800">
                      <span>Senior Platform Engineer — CloudScale Inc.</span>
                      <span className="text-[9px] text-slate-500 font-normal">2022 – Present</span>
                    </div>
                    <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5">
                      <li>Architected low-latency microservices serving over 2.4M daily active users.</li>
                      <li>Reduced page load latency by 38% through optimized caching and asset pipeline.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1">Core Competencies</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["TypeScript", "React", "Node.js", "PostgreSQL", "Cloud Architecture", "System Design"].map((skill, idx) => (
                      <span key={idx} className="text-[9px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Proof Ribbon */}
        <div className="mt-12 pt-8 border-t border-slate-900 w-full grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="block text-2xl font-bold text-white">100%</span>
            <span className="text-xs text-slate-400 mt-0.5 block font-medium">ATS Compliant Layouts</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-white">Instant</span>
            <span className="text-xs text-slate-400 mt-0.5 block font-medium">Real-Time PDF Rendering</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-emerald-400">Zero</span>
            <span className="text-xs text-slate-400 mt-0.5 block font-medium">Watermarks or Hidden Fees</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-indigo-400">Secure</span>
            <span className="text-xs text-slate-400 mt-0.5 block font-medium">Cloud Draft Storage</span>
          </div>
        </div>
      </section>

      {/* 3. 3-Step "How It Works" Visual Guide */}
      <section id="how-it-works" className="px-4 md:px-12 py-16 md:py-20 bg-slate-900/40 border-y border-slate-850">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Simple 3-Step Process</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              How to Build Your CV with ProCV
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2">
              From choosing a template to exporting a polished PDF in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm flex items-center justify-center mb-4 border border-indigo-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-white">Select a Design Template</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Choose from recruiter-approved layouts designed for executives, engineers, creative professionals, and marketers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm flex items-center justify-center mb-4 border border-indigo-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-white">Fill In or Import Details</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Add your work experience, education, and skills in our intuitive form, or upload your existing document to autofill.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm flex items-center justify-center mb-4 border border-indigo-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-white">Export ATS-Ready PDF</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Preview your changes live and download a high-resolution, print-ready PDF ready to submit to employers immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Template Preview Carousel / Grid */}
      <section id="templates" className="px-4 md:px-12 py-16 md:py-24 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Curated Designs</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Choose Your CV Layout
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Every template is crafted for optimal visual hierarchy, typography contrast, and ATS scanner readability.
          </p>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplateTab(tpl.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-5 text-left">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{currentTpl.category}</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{currentTpl.name}</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-2 leading-relaxed">
                {currentTpl.desc}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">Recommended Roles</span>
              <span className="text-xs font-semibold text-white">{currentTpl.recommendedFor}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Key Specifications</span>
              {currentTpl.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onStartBuilding(currentTpl.id)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                id={`homepage_use_tpl_${currentTpl.id}`}
              >
                <span>Use This Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onStartBuilding(currentTpl.id, "personal")}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Customize Content</span>
              </button>
            </div>
          </div>

          {/* Miniature Template Visual Preview */}
          <div className="lg:col-span-6 bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-800 flex justify-center">
            <div className="w-full max-w-sm bg-white text-slate-900 rounded-lg p-5 shadow-xl text-[10px] space-y-2.5 font-sans border border-slate-200">
              
              {/* Header */}
              <div className="border-b border-slate-200 pb-2 flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-xs text-slate-900">JANE DOE</p>
                  <p className="text-[9px] font-semibold text-indigo-600">Product Strategy & Operations</p>
                  <p className="text-[8px] text-slate-500">jane.doe@example.com • New York, NY</p>
                </div>
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-[8px] text-slate-600">
                  CV
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="font-bold text-[9px] text-slate-900 uppercase tracking-wider mb-0.5">Profile</p>
                <p className="text-[8px] text-slate-600 leading-tight">
                  Experienced strategist driving cross-functional growth initiatives and digital product transformation.
                </p>
              </div>

              {/* Experience */}
              <div>
                <p className="font-bold text-[9px] text-slate-900 uppercase tracking-wider mb-1">Experience</p>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[8px] text-slate-800">
                    <span>Director of Product — Horizon Ventures</span>
                    <span className="text-slate-400 font-normal">2021–Present</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-tight">
                    Led roadmap definition across 4 product suites, delivering $12M in annual recurring revenue.
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="font-bold text-[9px] text-slate-900 uppercase tracking-wider mb-1">Key Competencies</p>
                <div className="flex flex-wrap gap-1">
                  {["Roadmapping", "Data Analysis", "Cross-Functional Leadership", "Financial Modeling"].map((s, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[8px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 5. Benefits & Core Features */}
      <section id="features" className="px-4 md:px-12 py-16 md:py-20 bg-slate-900/30 border-t border-slate-850">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Product Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              Designed for Speed, Polish, and Real Hiring Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">ATS-Compliant Structure</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Standard headings, parseable layouts, and clean typographic hierarchies ensure applicant tracking systems read your experience flawlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Live Real-Time Preview</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Adjust section ordering, font families, theme accents, and vertical spacing with an instant A4 sheet preview.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">High-Resolution Export</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Download vector-sharp, print-ready PDF and PNG documents in seconds with zero watermarks or subscription barriers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Seamless Resume Import</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Upload your previous PDF or Word document to instantly populate all form fields and reformat into a modern template.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 px-4 md:px-12 py-10 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-xs shrink-0">
              AI
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-200">AI Professional CV Builder</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Build a high-performance career narrative instantly.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
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
              href="mailto:asadkhr39@gmail.com?subject=Inquiry regarding AI Professional CV Builder"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition cursor-pointer select-none font-semibold text-xs ml-2"
              id="homepage_contact_link"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© 2026 AI Professional CV Builder. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

