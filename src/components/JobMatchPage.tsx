import React, { useEffect } from "react";
import { 
  Target, CheckCircle2, AlertTriangle, ArrowRight, 
  Sparkles, FileText, ChevronRight, HelpCircle, Layers, 
  Award, ShieldCheck, Lock, Zap, LogIn, ExternalLink, Briefcase, BookOpen
} from "lucide-react";
import { CVData, CVRecord, DesignConfig } from "../types";
import { JobMatchView } from "./jobmatch/JobMatchView";
import { CVSelectorBar } from "./common/CVSelectorBar";
import { UserDropdown } from "./UserDropdown";

export interface JobMatchPageProps {
  cvData: CVData;
  designConfig: DesignConfig;
  cvTitle: string;
  cvId?: string;
  userCVs: CVRecord[];
  currentUser: { email: string; displayName: string; uid: string } | null;
  onUpdateCVData: (newData: CVData) => void;
  onSelectCV: (cvRecord: { data: CVData; design: DesignConfig; title: string; id?: string }) => void;
  onStartBuilding: () => void;
  onOpenATSChecker: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onNavigatePrivacy: () => void;
  onNavigateTerms: () => void;
}

export const JobMatchPage: React.FC<JobMatchPageProps> = ({
  cvData,
  designConfig,
  cvTitle,
  cvId,
  userCVs,
  currentUser,
  onUpdateCVData,
  onSelectCV,
  onStartBuilding,
  onOpenATSChecker,
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
    document.title = "Resume Job Match – Compare CV to Job Description | ProCVMaker";
    
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content", 
      "Match your resume against any job description with ProCVMaker. Discover matching qualifications, missing skills, keyword gaps, and tailored suggestions to get interviews."
    );

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://www.procvmaker.online/job-match");

    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Resume Job Match – Compare CV to Job Description | ProCVMaker");
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", "https://www.procvmaker.online/job-match");
  }, []);

  const handleImportSuccess = (parsedCV: CVData, title: string) => {
    onSelectCV({
      data: parsedCV,
      design: designConfig,
      title: title
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* 1. Header Navigation */}
      <header className="h-16 md:h-20 border-b border-slate-850 px-4 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center font-black text-white text-md shadow-xl shadow-teal-500/15 shrink-0 group-hover:scale-105 transition-transform">
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
          <button 
            onClick={onOpenATSChecker}
            className="hover:text-white transition-colors cursor-pointer"
          >
            ATS Checker
          </button>
          <span className="text-teal-400 font-bold border-b border-teal-400 pb-0.5">
            Job Match
          </span>
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
              id="job_match_page_signin_btn"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onStartBuilding}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-teal-500/20 cursor-pointer"
            id="job_match_page_top_cta_btn"
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
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Semantic Keyword Alignment &bull; Gap Detection &bull; Zero Hallucination Policy</span>
        </div>

        {/* Main H1 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Resume Job Match
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Compare your resume directly against any job description. Instantly identify matching qualifications, discover critical missing skills, and tailor your bullet points to fit the role without inventing facts.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-4xl mx-auto text-left">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
              <Target className="w-4 h-4" />
              <span>Exact &amp; Semantic Skills</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Matches both explicit technical keywords and natural semantic equivalencies.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Transparent Gap Analysis</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Pinpoints unmentioned job requirements and advises whether to add them.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
              <BookOpen className="w-4 h-4" />
              <span>Priority Keywords</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Categorizes job terms into Required vs Preferred with exact frequency counts.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>Anti-Hallucination Safe</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Rewrites only rephrase existing truths; never fabricate degrees or jobs.
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

        {/* Embedded Job Match View (Reusing exact engine & UI) */}
        <div className="shadow-2xl rounded-2xl overflow-hidden">
          <JobMatchView
            cvData={cvData}
            cvTitle={cvTitle}
            onUpdateCVData={onUpdateCVData}
            onOpenInEditor={onStartBuilding}
            onOpenATSChecker={onOpenATSChecker}
            inModal={false}
          />
        </div>

        {/* Cross-Link Banner: Next Step -> ATS Checker */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Next Step: Verify Formatting</span>
            </div>
            <h3 className="text-base font-bold text-white">Check Your Resume&apos;s ATS Parseability Score</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Now that your skills and keywords align with this job vacancy, verify that your resume structure, section titles, and action verbs pass automated corporate parsers with our <strong>Free ATS Resume Checker</strong>.
            </p>
          </div>

          <button
            onClick={onOpenATSChecker}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
            id="job_match_page_to_ats_btn"
          >
            <span>Run ATS Format Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* 4. Educational & SEO Content Section */}
      <section className="px-4 md:px-12 py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Section: How Job Description Matching Works */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Multi-Faceted Alignment</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How Our Resume Job Match Engine Evaluates Alignment
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                A high-performing tailored resume does not merely repeat keywords. Our engine computes an objective match percentage weighted across five key job criteria:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              
              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">1. Skills Match</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">30% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts hard technologies, methodologies, and core proficiencies from the posting and maps them against your work bullets and skill entries.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">2. Experience Alignment</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">25% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compares seniority expectations (years in field, leadership duties, project complexity) to your demonstrated career progression.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">3. Keyword Coverage</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">20% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks essential industry terminology and phrases, tracking whether required qualifications are present in your resume.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">4. Role Relevance</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">15% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates whether your past job titles, summaries, and highlighted projects directly correlate with the target position&apos;s daily duties.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">5. Education Alignment</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">10% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates degree requirements, fields of study, and relevant professional certifications requested by the hiring company.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-teal-300">Total Score: 100 Points</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Transparent mathematical scoring. No black-box guesses or arbitrary penalties.
                  </p>
                </div>
                <button
                  onClick={onStartBuilding}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 mt-2 cursor-pointer"
                >
                  <span>Build Tailored CV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Section: Tailoring Advice */}
          <div className="border-t border-slate-800 pt-12 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Smart Strategy</span>
              <h2 className="text-2xl font-bold text-white">How to Tailor Your CV Without Keyword Stuffing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center font-bold text-xs text-teal-300">1</span>
                <h3 className="text-sm font-bold text-white">Mirror Authentic Terminology</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If the job says &ldquo;Client Relationship Management&rdquo; and your CV says &ldquo;Account Servicing&rdquo;, rephrase using the employer&apos;s phrasing if you have genuine experience.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center font-bold text-xs text-teal-300">2</span>
                <h3 className="text-sm font-bold text-white">Emphasize Priority Requirements</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Put the skills and responsibilities marked as &ldquo;Required&rdquo; higher up in your bullet points or in your professional summary so recruiters see them immediately.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center font-bold text-xs text-teal-300">3</span>
                <h3 className="text-sm font-bold text-white">Address Gaps Honestly</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never fabricate missing qualifications. Instead, highlight adjacent experience or fast learning capacity in your summary or cover letter.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Frequently Asked Questions (FAQ) */}
          <div className="border-t border-slate-800 pt-12 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Got Questions?</span>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto text-xs">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Why is matching a CV to a job description so important?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Corporate recruiters receive hundreds of applications per opening. ATS search queries and recruiter screeners prioritize candidates whose resumes explicitly reflect the key skills and core deliverables described in the posting.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>What is a good Job Match score?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  A score above 75% indicates strong alignment with the role&apos;s essential qualifications. A score above 85% means your experience, skills, and vocabulary closely mirror what the hiring team is looking for.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Does ProCVMaker invent or hallucinate skills?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  No. We operate under a strict anti-hallucination policy. Missing requirements are labeled as gaps, and our tailoring recommendations only rephrase the authentic achievements already in your resume.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Can I save different tailored versions of my resume?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Yes! When logged in to ProCVMaker, you can create and store multiple tailored CVs in your cloud dashboard (e.g. &ldquo;Software Engineer – Fintech&rdquo;, &ldquo;Full Stack – Healthcare&rdquo;) and download free PDFs for each application.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="p-8 bg-gradient-to-tr from-teal-950/40 via-slate-900 to-slate-950 border border-teal-800/40 rounded-3xl text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Tailor Your Resume in Minutes</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Launch our full CV Editor to apply tailoring suggestions, adjust design layouts, and export ATS-compliant PDFs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onStartBuilding}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/25 cursor-pointer flex items-center gap-2"
                id="job_match_page_bottom_builder_btn"
              >
                <span>Launch Resume Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenATSChecker}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer border border-slate-700"
              >
                <span>Free ATS Resume Checker</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-10 px-4 md:px-12 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
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
            <button
              onClick={onOpenATSChecker}
              className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Free ATS Resume Checker
            </button>
            <span className="text-teal-400 font-semibold">
              Job Match
            </span>
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
          <p className="mt-2 sm:mt-0">Zero paywalls &bull; Ethical, authentic tailoring</p>
        </div>
      </footer>

    </div>
  );
};
