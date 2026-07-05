import React from "react";
import { 
  Sparkles, ShieldCheck, Zap, Award, Mail, ChevronRight, LogIn, LogOut, LayoutDashboard,
  FileText, Star, Eye, Laptop, CheckCircle2, UserCheck, ArrowRight, Plus, UploadCloud, FileCheck, Brain
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
  
  // High fidelity mockup template cards to let users select and start directly
  const quickTemplates: { id: TemplateId; name: string; desc: string; color: string; badge: string }[] = [
    { id: "modern", name: "Modern Elite", desc: "Sleek, high-contrast visual layout for technical leaders.", color: "from-indigo-500 to-purple-600", badge: "Most Popular" },
    { id: "executive", name: "Executive Suite", desc: "Traditional serif styling for finance, operations, and law.", color: "from-amber-500 to-orange-600", badge: "ATS Optimized" },
    { id: "minimalist", name: "Minimal Clean", desc: "Generous whitespace and compact layouts for design pros.", color: "from-emerald-500 to-teal-600", badge: "Designer's Pick" },
    { id: "creative", name: "Creative Edge", desc: "Left-aligned asymmetric sidebar layout for bold roles.", color: "from-pink-500 to-rose-600", badge: "Bold Choice" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans select-none bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.35),rgba(2,6,23,1))]">
      
      {/* Background visual light flares */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* 1. Navigation Bar */}
      <nav className="h-20 border-b border-slate-900/80 px-4 md:px-12 flex items-center justify-between relative z-10 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-xl shadow-indigo-500/15">
            AI
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black text-white tracking-tight leading-none flex items-center gap-2">
              AI Professional CV Builder
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5 uppercase">Powered by Gemini AI</p>
          </div>
        </div>

        {/* Auth / Action Menu */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition select-none cursor-pointer"
                title="View My Activity Logs & CV Snapshots"
                id="homepage_nav_dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Dashboard</span>
              </button>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-[11px] font-bold text-white max-w-[120px] truncate leading-none">
                  {currentUser.displayName}
                </span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-extrabold text-indigo-400 text-xs shadow-md shrink-0">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                id="homepage_nav_signout"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-indigo-600/10 cursor-pointer"
              id="homepage_nav_signin"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </nav>

      {/* 2. Hero Section (Main Banner) */}
      <section className="relative z-10 px-4 md:px-12 pt-12 md:pt-20 pb-16 text-center flex-grow flex flex-col items-center max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold mb-6 tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Generation Resume Intelligence is Here</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-3xl"
        >
          Craft Your Next Career Move with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Instant AI Precision</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-sm md:text-base mt-6 max-w-2xl leading-relaxed font-medium"
        >
          Polishing resume draft points using Gemini AI, optimizing layout density in one click, and securely sync and download history logs. Stand out on every job application with confidence.
        </motion.p>

        {/* Two Separate High-Visibility Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl text-left"
        >
          {/* Action 1: Create Fresh CV */}
          <div 
            onClick={() => onStartBuilding(undefined, "personal")}
            className="group flex flex-col justify-between p-6 bg-slate-900/30 hover:bg-slate-900/60 backdrop-blur-md border border-slate-850 hover:border-indigo-500/40 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-indigo-500/5"
            id="homepage_action_scratch"
          >
            <div>
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">Create Fresh CV</h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Choose a pre-designed layout, fill in your details, and export an ATS-friendly PDF instantly.
              </p>
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-650 group-hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer select-none">
              <span>Start from Scratch</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Action 2: Upload & Parse Previous CV */}
          <div 
            onClick={onOpenAIImport}
            className="group flex flex-col justify-between p-6 bg-slate-900/30 hover:bg-slate-900/60 backdrop-blur-md border border-slate-850 hover:border-violet-500/40 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-violet-500/5"
            id="homepage_action_import"
          >
            <div>
              <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white group-hover:text-violet-400 transition-colors">Upload & Edit CV</h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Upload your previous Word document, PDF, JPEG/PNG image, or paste text. Gemini AI will parse and format it in seconds.
              </p>
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-650 group-hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition cursor-pointer select-none">
              <span>Parse & Import with AI</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>

        {currentUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Access Cloud Download & AI Logs</span>
            </button>
          </motion.div>
        )}

        {/* Stats and validation ribbon */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-slate-900/60 w-full grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-slate-500"
        >
          <div>
            <span className="block text-2xl font-black text-white">10,000+</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resumes Formatted</span>
          </div>
          <div>
            <span className="block text-2xl font-black text-white">99.4%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ATS Acceptance Rate</span>
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400">100% Free</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No Paywalls or Watermarks</span>
          </div>
          <div>
            <span className="block text-2xl font-black text-indigo-400">Gemini Pro</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LLM Generation</span>
          </div>
        </motion.div>
      </section>

      {/* Modern Card Template Chooser Showcase */}
      <section className="px-4 md:px-12 py-10 max-w-6xl mx-auto relative z-10 w-full">
        <div className="text-center mb-8">
          <h3 className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Visual Layouts</h3>
          <h2 className="text-xl font-black text-white mt-1">Start Instantly from Any Layout Style</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickTemplates.map((tpl) => (
            <div 
              key={tpl.id}
              onClick={() => onStartBuilding(tpl.id)}
              className="p-5 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer text-left flex flex-col justify-between h-44"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] px-2 py-0.5 bg-gradient-to-r ${tpl.color} rounded-full font-bold text-white uppercase tracking-wider`}>
                    {tpl.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-sm font-black text-white mt-3.5 group-hover:text-indigo-400 transition-colors">
                  {tpl.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {tpl.desc}
                </p>
              </div>
              
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors flex items-center gap-1 mt-4">
                <span>Configure layout</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Benefits / Features Section */}
      <section className="px-4 md:px-12 py-16 md:py-24 bg-slate-950/80 border-t border-slate-900 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Engineered for Excellence</span>
            <h2 className="text-3xl font-black text-white mt-2 tracking-tight">
              Powerful Core Features Built for High-Performance Candidates
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-3 leading-relaxed">
              We combined advanced semantic language models with clean design standards to deliver a premium CV builder that increases your visibility to hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-left transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">AI-Powered Optimization</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Refine bullet points and craft customized professional bios in seconds using Google's state-of-the-art Gemini LLM model natively.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-left transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Secure Data & History</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Save your CV data draft dynamically to Google Firebase Firestore. Safely access and open past download snapshots via your Dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-left transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/20">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">ATS-Friendly Layouts</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Our templates are structured with single-column layouts and proper margins to ensure 100% compliance with corporate recruiters' scanners.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-left transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">100% Free & Speed</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Instant high-resolution PDF or PNG file exports. Zero hidden fees, zero paywalls, and absolutely no branding watermarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer / Contact Us Section */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 md:px-12 py-12 relative z-10 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-slate-300 text-xs shrink-0">
              AI
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-300">AI Professional CV Builder</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Build a high-performance career narrative instantly.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <span className="font-medium text-slate-400">© 2026 AI Professional CV Builder. Developed by <span className="text-indigo-400 font-bold">Asad Mustafa</span>. All rights reserved.</span>
            
            {/* Direct Gmail mailto link strictly targeting the user's Gmail in metadata */}
            <a 
              href="mailto:asadkhr8@gmail.com?subject=Inquiry regarding AI Professional CV Builder"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer select-none font-bold"
              id="homepage_contact_link"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
