import React, { useEffect } from "react";
import { 
  ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, 
  Sparkles, FileText, ChevronRight, HelpCircle, Layers, 
  Award, Target, Lock, Zap, LogIn, ExternalLink, RefreshCw
} from "lucide-react";
import { CVData, CVRecord, DesignConfig } from "../types";
import { ATSAnalyzerView } from "./ats/ATSAnalyzerView";
import { CVSelectorBar } from "./common/CVSelectorBar";
import { UserDropdown } from "./UserDropdown";

export interface ATSCheckerPageProps {
  cvData: CVData;
  designConfig: DesignConfig;
  cvTitle: string;
  cvId?: string;
  userCVs: CVRecord[];
  currentUser: { email: string; displayName: string; uid: string } | null;
  onUpdateCVData: (newData: CVData) => void;
  onSelectCV: (cvRecord: { data: CVData; design: DesignConfig; title: string; id?: string }) => void;
  onStartBuilding: () => void;
  onOpenJobMatch: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onNavigatePrivacy: () => void;
  onNavigateTerms: () => void;
}

export const ATSCheckerPage: React.FC<ATSCheckerPageProps> = ({
  cvData,
  designConfig,
  cvTitle,
  cvId,
  userCVs,
  currentUser,
  onUpdateCVData,
  onSelectCV,
  onStartBuilding,
  onOpenJobMatch,
  onOpenDashboard,
  onOpenSettings,
  onSignIn,
  onSignOut,
  onNavigateHome,
  onNavigatePrivacy,
  onNavigateTerms
}) => {
  // Sync page SEO metadata on mount
  useEffect(() => {
    document.title = "Free ATS Resume Checker – Test & Improve Resume Score | ProCVMaker";
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content", 
      "Check your resume's ATS score for free with ProCVMaker. Scan for parsing errors, critical issues, formatting compatibility, and get AI-powered bullet-point improvements."
    );

    // Update or create canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://www.procvmaker.online/ats-checker");

    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Free ATS Resume Checker – Test & Improve Resume Score | ProCVMaker");
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", "https://www.procvmaker.online/ats-checker");
  }, []);

  const handleImportSuccess = (parsedCV: CVData, title: string) => {
    onSelectCV({
      data: parsedCV,
      design: designConfig,
      title: title
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* 1. Header Navigation */}
      <header className="h-16 md:h-20 border-b border-slate-850 px-4 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-md shadow-xl shadow-indigo-500/15 shrink-0 group-hover:scale-105 transition-transform">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">ProCVMaker</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">AI CV Builder &amp; ATS Resume Checker</p>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <button 
            onClick={onStartBuilding}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Resume Builder
          </button>
          <span className="text-indigo-400 font-bold border-b border-indigo-400 pb-0.5">
            ATS Checker
          </span>
          <button 
            onClick={onOpenJobMatch}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Job Match
          </button>
        </nav>

        {/* User Account / Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {currentUser ? (
            <UserDropdown
              currentUser={currentUser}
              onOpenDashboard={onOpenDashboard || onStartBuilding}
              onOpenSettings={onOpenSettings || onOpenDashboard || onStartBuilding}
              onSignOut={onSignOut}
              onNavigatePrivacy={onNavigatePrivacy}
              onNavigateTerms={onNavigateTerms}
            />
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl text-xs font-semibold transition cursor-pointer border border-transparent hover:border-slate-800"
              id="ats_page_signin_btn"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onStartBuilding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-indigo-600/20 cursor-pointer"
            id="ats_page_top_cta_btn"
          >
            <span>Open CV Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative px-4 md:px-12 pt-10 md:pt-16 pb-8 max-w-6xl mx-auto w-full text-center">
        
        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-xs font-medium mb-5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Deterministic ATS Rule Checks + AI Content Polish &bull; 100% Free</span>
        </div>

        {/* Main H1 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Free ATS Resume Checker
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Audit your resume against the parsing algorithms used by modern Applicant Tracking Systems (ATS). Spot hidden structural bugs, quantify your bullet points, and optimize wording to get more recruiter callbacks.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-4xl mx-auto text-left">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Parseability Audit</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Ensures clear text layer, standard sections, and clean font formatting.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
              <Target className="w-4 h-4" />
              <span>Action Verbs &amp; Impact</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Identifies passive language and flags bullets that lack measurable numbers.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>1-Click Diff Rewrites</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Apply fact-preserving active rewrites directly to your resume.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>No Fabricated Data</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Strict guardrails ensure your authentic career history is never falsified.
            </p>
          </div>
        </div>

      </section>

      {/* 3. Main Tool Interactive Interface */}
      <main className="px-4 md:px-12 pb-16 max-w-6xl mx-auto w-full space-y-6">
        
        {/* CV Selector & Import Bar */}
        <CVSelectorBar
          selectedCvData={cvData}
          selectedDesignConfig={designConfig}
          selectedCvTitle={cvTitle}
          selectedCvId={cvId}
          userCVs={userCVs}
          currentUser={currentUser}
          onSelectCV={onSelectCV}
          onOpenInEditor={onStartBuilding}
          onOpenAuth={onSignIn}
          onImportSuccess={handleImportSuccess}
        />

        {/* Embedded ATS Analyzer View (Reusing exact analyzer engine & UI) */}
        <div className="shadow-2xl rounded-2xl overflow-hidden">
          <ATSAnalyzerView
            cvData={cvData}
            designConfig={designConfig}
            cvTitle={cvTitle}
            onUpdateCVData={onUpdateCVData}
            onOpenJobMatch={onOpenJobMatch}
            onOpenInEditor={onStartBuilding}
            inModal={false}
            autoRun={true}
          />
        </div>

        {/* Cross-Link Banner: Next Step -> Job Match */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Next Step: Tailor for a Vacancy</span>
            </div>
            <h3 className="text-base font-bold text-white">Compare this CV against a Specific Job Posting</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              An ATS check confirms your resume format and syntax are clean. Next, run <strong>Job Match</strong> to see how closely your experience matches the specific skills and qualifications in a target vacancy.
            </p>
          </div>

          <button
            onClick={onOpenJobMatch}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-md shadow-teal-500/20"
            id="ats_page_to_job_match_btn"
          >
            <span>Try Resume Job Match</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* 4. Educational & SEO Content Section */}
      <section className="px-4 md:px-12 py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Section: What the ATS Analysis Checks */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Comprehensive Scoring Engine</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                What Does Our Free ATS Resume Checker Audit?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Applicant Tracking Systems evaluate resumes using multi-layered parsing heuristics. Our hybrid engine scores your CV across 6 critical weighted dimensions:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              
              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">1. Parseability &amp; Hygiene</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">25% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks that text layers are machine-readable, standard UTF-8 characters are used, fonts are universally supported, and layout structures won&apos;t scramble in Taleo, Workday, or Greenhouse.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">2. Structure &amp; Sections</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">20% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verifies standard section titles (Experience, Education, Skills, Summary), date formats (Month YYYY), and reverse-chronological work histories so parsers don&apos;t drop employment periods.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">3. Content Quality &amp; Verbs</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">20% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Flags weak or passive phrases (&ldquo;Responsible for&rdquo;, &ldquo;Helped with&rdquo;) and recommends decisive action verbs (&ldquo;Architected&rdquo;, &ldquo;Negotiated&rdquo;, &ldquo;Spearheaded&rdquo;) that capture recruiter interest.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">4. Achievement Impact</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">15% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Quantifies accomplishments. Checks for numbers, percentages, dollar figures, and team sizes that prove your real-world contribution rather than listing generic job duties.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">5. Readability &amp; Tone</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">15% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assesses sentence length, repetition, and professional executive tone. Keeps bullet points between 10 and 35 words so human recruiters can scan them in 6 seconds.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">6. Contact Completeness</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">5% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Confirms valid email formatting, professional phone number notation, location (City, State/Country), and LinkedIn profile link availability for recruiter contact.
                </p>
              </div>

            </div>
          </div>

          {/* Section: 3-Step Process */}
          <div className="border-t border-slate-800 pt-12 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Simple Workflow</span>
              <h2 className="text-2xl font-bold text-white">How to Optimize Your Resume with ProCVMaker</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative">
                <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">1</span>
                <h3 className="text-sm font-bold text-white">Select or Upload Resume</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a resume saved in your ProCVMaker account, or upload a PDF, DOCX, or text file to parse your existing work history into our editor.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative">
                <span className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center font-bold text-xs text-teal-300">2</span>
                <h3 className="text-sm font-bold text-white">Run Instant ATS Audit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our hybrid engine scans layout safety, computes category scores, and categorizes findings into Critical Issues, Important Improvements, and Suggestions.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative">
                <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-300">3</span>
                <h3 className="text-sm font-bold text-white">Apply Fixes in CV Builder</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review side-by-side active voice rewrites and apply them directly to your CV. Then download a clean, ATS-compliant PDF ready for corporate portals.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Frequently Asked Questions (FAQ) */}
          <div className="border-t border-slate-800 pt-12 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Got Questions?</span>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto text-xs">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>What is an ATS (Applicant Tracking System)?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  An Applicant Tracking System is HR software (such as Workday, Taleo, iCIMS, or Greenhouse) used by employers to collect, sort, and screen job applications. It parses your CV into structured database fields (contact info, jobs, education, and skills) before a human recruiter ever sees it.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Why do resumes get rejected by ATS software?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Most ATS rejections happen because of two things: formatting errors (tables, graphics, unreadable fonts, or non-standard headings that confuse the parser) and content shortcomings (lack of clear role keywords, passive language, or no measurable achievements).
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Is this ATS Resume Checker really free?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Yes, ProCVMaker&apos;s ATS Resume Checker is completely free. You can scan your CV, inspect all critical issues, and review improvement suggestions without any paywalls or required subscriptions.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>How is ATS Checker different from Resume Job Match?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  The ATS Checker audits your CV&apos;s overall health, structure, active phrasing, and formatting compatibility against general ATS parsing standards. In contrast, <strong>Resume Job Match</strong> compares your CV directly against a specific job vacancy posting to see which required qualifications and keywords you match or are missing.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Does having a high ATS score guarantee a job interview?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  A high score ensures your CV is machine-readable and presents your achievements in a clean, professional format that passes automated filtering. Final hiring decisions always depend on recruiter evaluation, interview performance, and specific employer fit.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="p-8 bg-gradient-to-tr from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-800/40 rounded-3xl text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Ready to Perfect Your Resume?</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Build or edit your CV using our professional, ATS-friendly templates with real-time live preview and free PDF export.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onStartBuilding}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center gap-2"
                id="ats_page_bottom_builder_btn"
              >
                <span>Launch Resume Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenJobMatch}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer border border-slate-700"
              >
                <span>Compare Against a Job Posting</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-10 px-4 md:px-12 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-bold text-white text-xs">
              AI
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-200">ProCVMaker</p>
              <p className="text-[11px] text-slate-400">AI CV Builder &amp; ATS Resume Checker</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
            <button
              onClick={onNavigateHome}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={onStartBuilding}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Resume Builder
            </button>
            <span className="text-indigo-400 font-semibold">
              Free ATS Resume Checker
            </span>
            <button
              onClick={onOpenJobMatch}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Job Match
            </button>
            <button
              onClick={onNavigatePrivacy}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onNavigateTerms}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© 2026 ProCVMaker. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Zero paywalls &bull; Authentic career presentation</p>
        </div>
      </footer>

    </div>
  );
};
