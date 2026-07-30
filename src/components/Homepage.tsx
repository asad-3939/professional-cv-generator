import React, { useState } from "react";
import { 
  Sparkles, ShieldCheck, Zap, Award, Mail, ChevronRight, LogIn, LogOut, LayoutDashboard,
  FileText, ArrowRight, Plus, UploadCloud, Terminal, Check, Layers, ArrowUpRight, Cpu, FileCode
} from "lucide-react";
import { motion } from "motion/react";
import { TemplateId } from "../types";

interface HomepageProps {
  currentUser: { email: string; displayName: string; uid: string } | null;
  onStartBuilding: (templateId?: TemplateId, initialTab?: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDashboard: () => void;
  onOpenAIImport: () => void;
}

export function Homepage({ 
  currentUser, 
  onStartBuilding, 
  onSignIn, 
  onSignOut, 
  onOpenDashboard,
  onOpenAIImport
}: HomepageProps) {
  
  const [activePreviewTab, setActivePreviewTab] = useState<"summary" | "bullets" | "ats">("bullets");

  const quickTemplates: { id: TemplateId; name: string; tag: string; desc: string; specs: string }[] = [
    { 
      id: "modern", 
      name: "Modern Elite", 
      tag: "TECHNICAL & TECH LEADERSHIP", 
      desc: "High-density two-column geometry engineered for senior engineers and product leaders.",
      specs: "Compact • High Contrast"
    },
    { 
      id: "executive", 
      name: "Executive Suite", 
      tag: "FINANCE, LEGAL & OPS", 
      desc: "Editorial typography paired with classic serif headers for corporate executive roles.",
      specs: "Traditional • Formal Serif"
    },
    { 
      id: "minimalist", 
      name: "Minimal Clean", 
      tag: "DESIGN & PRODUCT", 
      desc: "Generous whitespace with strict grid alignment for visual clarity and readability.",
      specs: "Spacious • Modern Sans"
    },
    { 
      id: "creative", 
      name: "Creative Edge", 
      tag: "STRATEGY & GROWTH", 
      desc: "Left-accented asymmetrical column hierarchy designed to make candidate profiles stand out.",
      specs: "Asymmetric • Bold Focus"
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden font-sans select-none">
      
      {/* Precision Grid Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none z-0" 
      />

      {/* 1. Header / Top Navigation */}
      <nav className="h-18 border-b border-zinc-800/80 px-4 md:px-10 flex items-center justify-between relative z-20 bg-zinc-950/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-black text-indigo-400 text-xs tracking-tighter">
            AI
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-extrabold text-zinc-100 tracking-tight">
                AI CV BUILDER
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 rounded font-semibold uppercase tracking-wider">
                v3.5
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider hidden sm:block">
              INTELLIGENT RESUME ARCHITECTURE
            </span>
          </div>
        </div>

        {/* Navigation Action Area */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-md text-xs font-semibold transition cursor-pointer"
                title="View Saved Logs & History"
                id="homepage_nav_dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">My Dashboard</span>
              </button>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-200 max-w-[120px] truncate leading-none">
                  {currentUser.displayName}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>

              <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-xs shrink-0">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={onSignOut}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-md text-xs font-medium transition cursor-pointer shrink-0"
                id="homepage_nav_signout"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md text-xs transition cursor-pointer tracking-tight"
              id="homepage_nav_signin"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </nav>

      {/* 2. Asymmetric Hero Section */}
      <section className="relative z-10 px-4 md:px-10 pt-10 md:pt-16 pb-16 max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Editorial Headline & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-300"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-zinc-400">ENGINE:</span>
              <span className="text-indigo-400 font-semibold">ATS-COMPLIANT VECTOR MATRIX</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-100 tracking-tight leading-[1.08] uppercase"
            >
              ENGINEER YOUR CAREER NARRATIVE WITH <span className="text-indigo-400 underline decoration-indigo-500/40 underline-offset-8">ATOMIC PRECISION</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl font-normal"
            >
              A high-performance CV builder designed for engineers, executives, and specialists. Parse legacy files, optimize impact bullets with AI, and output sub-3MB print-ready vector PDFs in seconds.
            </motion.p>

            {/* Quick Action Matrix */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <button
                onClick={() => onStartBuilding(undefined, "personal")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded transition cursor-pointer select-none group"
                id="homepage_action_scratch"
              >
                <Plus className="w-4 h-4" />
                <span>Build From Scratch</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAIImport}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer select-none group"
                id="homepage_action_import"
              >
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                <span>Upload & AI Parse File</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </button>
            </motion.div>

            {/* Key Metrics Strip */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 border-t border-zinc-900 grid grid-cols-3 gap-4 text-left font-mono"
            >
              <div>
                <span className="block text-xl font-extrabold text-zinc-100">100%</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">ATS Compliance</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-indigo-400">&lt; 3 MB</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Vector Export</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-zinc-100">$0</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Zero Watermarks</span>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Live Interactive Architecture Preview Component (5 cols) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-lg p-5 shadow-2xl relative overflow-hidden text-left"
          >
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="text-zinc-500 ml-2">LIVE_CANVAS_PREVIEW.PDF</span>
              </div>
              <span className="text-indigo-400 font-bold px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-800/50 rounded">
                OPTIMIZED (200 DPI)
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded border border-zinc-800 mb-4 font-mono text-[10px]">
              <button 
                onClick={() => setActivePreviewTab("bullets")}
                className={`flex-1 py-1 px-2 rounded font-semibold transition ${
                  activePreviewTab === "bullets" ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                AI Bullet Polish
              </button>
              <button 
                onClick={() => setActivePreviewTab("summary")}
                className={`flex-1 py-1 px-2 rounded font-semibold transition ${
                  activePreviewTab === "summary" ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Executive Bio
              </button>
              <button 
                onClick={() => setActivePreviewTab("ats")}
                className={`flex-1 py-1 px-2 rounded font-semibold transition ${
                  activePreviewTab === "ats" ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ATS Audit
              </button>
            </div>

            {/* Mini Document Simulation Box */}
            <div className="bg-zinc-950 border border-zinc-800 rounded p-4 space-y-3 font-sans">
              <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 tracking-tight">ALEXANDER V. MORGAN</h4>
                  <p className="text-[10px] text-indigo-400 font-mono">STAFF SOFTWARE ENGINEER & SYSTEMS ARCHITECT</p>
                </div>
                <div className="text-[9px] text-zinc-500 font-mono text-right">
                  <span>SAN FRANCISCO, CA</span>
                  <br />
                  <span>ALEX@DEV.IO</span>
                </div>
              </div>

              {activePreviewTab === "bullets" && (
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-400 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>AI Enhanced Impact Bullets</span>
                  </div>
                  <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded text-zinc-300 space-y-1.5 font-sans">
                    <p className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>Architected high-throughput microservices handling 45M+ daily requests with 99.99% uptime.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>Reduced PDF rendering memory overhead by 84% utilizing client-side canvas compression algorithms.</span>
                    </p>
                  </div>
                </div>
              )}

              {activePreviewTab === "summary" && (
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-400 uppercase tracking-wider">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Structured Professional Narrative</span>
                  </div>
                  <p className="p-2 bg-zinc-900/90 border border-zinc-800 rounded text-zinc-300 text-[10.5px]">
                    Technical leader with 8+ years driving distributed backend architecture, cloud data pipelines, and developer tooling. Proven track record scaling engineering teams and building ATS-validated executive resumes.
                  </p>
                </div>
              )}

              {activePreviewTab === "ats" && (
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center font-mono text-[9px] text-zinc-400 uppercase">
                    <span>ATS Machine Scanner Verification</span>
                    <span className="text-indigo-400 font-bold">SCORE: 98/100</span>
                  </div>
                  <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-400" /> Parseable Font Hierarchy</span>
                      <span className="font-mono text-indigo-400">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-400" /> Standard Section Headings</span>
                      <span className="font-mono text-indigo-400">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-400" /> Keyword Density Index</span>
                      <span className="font-mono text-indigo-400">OPTIMAL</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between font-mono text-[9px] text-zinc-500 border-t border-zinc-850">
                <span>PDF SIZE: 1.2 MB</span>
                <span>FONTS: COMPRESSED</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[10px]">READY TO BUILD YOURS?</span>
              <button 
                onClick={() => onStartBuilding(undefined, "personal")}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
              >
                <span>Launch Builder</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Structural Archetype Selector Showcase */}
      <section className="px-4 md:px-10 py-16 border-t border-zinc-900 bg-zinc-950/60 relative z-10 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 text-left">
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-widest uppercase block mb-1">
                // SELECT YOUR STRUCTURAL ARCHETYPE
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tight uppercase">
                Purpose-Built Layout Templates
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-md font-normal leading-relaxed">
              Every layout is meticulously configured for ATS parsing engines and senior recruiter scanning patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                onClick={() => onStartBuilding(tpl.id)}
                className="p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group h-52 relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-800 text-indigo-400 border border-zinc-700 rounded font-semibold uppercase tracking-wider">
                      {tpl.specs}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-black text-zinc-100 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                    {tpl.name}
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-500 mt-0.5 tracking-wider uppercase">
                    {tpl.tag}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {tpl.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span>Load archetype</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Matrix */}
      <section className="px-4 md:px-10 py-16 md:py-20 border-t border-zinc-900 bg-zinc-950 relative z-10">
        <div className="max-w-7xl mx-auto text-left">
          <div className="mb-12">
            <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-widest uppercase block mb-1">
              // ARCHITECTURAL CAPABILITIES
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tight uppercase">
              Engineered For Modern Career Professionals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded text-left hover:border-zinc-700 transition">
              <span className="font-mono text-xs text-indigo-400 font-bold block mb-3">01 // AI OPTIMIZER</span>
              <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 mb-4">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">Impact Bullet Engine</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Transform weak job duties into quantified achievement metrics using advanced language analysis.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded text-left hover:border-zinc-700 transition">
              <span className="font-mono text-xs text-indigo-400 font-bold block mb-3">02 // DOCUMENT PARSER</span>
              <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 mb-4">
                <FileCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">Smart Resume Import</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Upload Word, PDF, or raw text files. The parser extracts experience, education, and skills seamlessly.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded text-left hover:border-zinc-700 transition">
              <span className="font-mono text-xs text-indigo-400 font-bold block mb-3">03 // FIREBASE VAULT</span>
              <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">Firestore Cloud Autosave</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                All changes sync seamlessly to Firebase Firestore. Revisit previous CV snapshots anytime from your Dashboard.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded text-left hover:border-zinc-700 transition">
              <span className="font-mono text-xs text-indigo-400 font-bold block mb-3">04 // VECTOR PDF</span>
              <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 mb-4">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">Sub-3MB Crisp Output</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Pixel-perfect 200 DPI canvas rendering. High resolution, zero paywalls, and zero branding watermarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clean Architectural Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 md:px-10 py-10 relative z-10 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-indigo-400 text-xs shrink-0">
              AI
            </div>
            <div className="text-left">
              <p className="font-bold text-zinc-200">AI PROFESSIONAL CV BUILDER</p>
              <p className="text-[10px] text-zinc-500 font-mono">INTELLIGENT CAREER MATERIAL ARCHITECTURE</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="font-medium text-zinc-400">
              © 2026 AI Professional CV Builder. Developed by <span className="text-indigo-400 font-bold">Asad Mustafa</span>.
            </span>
            
            <a 
              href="mailto:asadkhr8@gmail.com?subject=Inquiry regarding AI Professional CV Builder"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded text-xs transition cursor-pointer select-none font-bold"
              id="homepage_contact_link"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact Developer</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

