import React, { useEffect, useState } from "react";
import { 
  Target, CheckCircle2, AlertTriangle, ArrowRight, 
  Sparkles, FileText, ChevronRight, HelpCircle, Layers, 
  Award, ShieldCheck, Lock, Zap, LogIn, ExternalLink, Briefcase, BookOpen
} from "lucide-react";
import { CVData, CVRecord, DesignConfig } from "../types";
import { JobMatchView } from "./jobmatch/JobMatchView";
import { ResumeUpload } from "./common/ResumeUpload";
import { UserDropdown } from "./UserDropdown";
import { Header } from "./Header";

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
  onNavigateTemplates?: () => void;
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
  onNavigateTemplates,
  onOpenDashboard,
  onOpenSettings,
  onSignIn,
  onSignOut,
  onNavigateHome,
  onNavigatePrivacy,
  onNavigateTerms
}) => {
  const [matchKey, setMatchKey] = useState<number>(0);

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
    setMatchKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* 1. Header Navigation */}
      <Header
        currentRoute="job-match"
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        onNavigateBuilder={onStartBuilding}
        onNavigateATSChecker={onOpenATSChecker}
        onNavigateJobMatch={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onNavigateTemplates={onNavigateTemplates || (() => {
          onNavigateHome();
          setTimeout(() => {
            document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
          }, 150);
        })}
        onOpenDashboard={onOpenDashboard}
        onOpenSettings={onOpenSettings}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onNavigatePrivacy={onNavigatePrivacy}
        onNavigateTerms={onNavigateTerms}
        primaryCtaLabel="Open CV Editor"
        onPrimaryCta={onStartBuilding}
      />

      {/* 2. Tool-First Hero Header */}
      <section className="relative px-4 md:px-12 pt-6 md:pt-8 pb-4 max-w-5xl mx-auto w-full text-center">
        
        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-xs font-medium mb-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Semantic Keyword Alignment &bull; Gap Detection &bull; Zero Hallucinations</span>
        </div>

        {/* Main H1 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Resume Job Match
        </h1>

        <p className="mt-2.5 text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Compare your resume directly against any job description. Instantly identify matching qualifications, discover critical missing skills, and tailor your bullet points to fit the role without inventing facts.
        </p>

        {/* 3-Step Process Flow Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-5 max-w-2xl mx-auto text-left">
          <div className="p-2.5 sm:p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Upload Resume</p>
              <p className="text-[10px] text-slate-400 hidden sm:block">File or My CVs</p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Paste Job Spec</p>
              <p className="text-[10px] text-slate-400 hidden sm:block">Target Vacancy</p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Check Match</p>
              <p className="text-[10px] text-slate-400 hidden sm:block">Score &amp; Gaps</p>
            </div>
          </div>
        </div>

      </section>

      {/* 3. Main Tool Interactive Interface */}
      <main className="px-4 md:px-12 pb-16 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Step 1: Upload CV / Select from My CVs (Unified ResumeUpload component) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Step 1</span>
              <h3 className="text-sm sm:text-base font-bold text-white">Select or Upload Resume to Match</h3>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Compare this document against your target role
            </span>
          </div>

          <ResumeUpload
            onUploadSuccess={handleImportSuccess}
            currentUser={currentUser}
            userCVs={userCVs}
            onSelectSavedCV={(record) => {
              onSelectCV(record);
              setMatchKey(prev => prev + 1);
            }}
            currentCvTitle={cvTitle}
            onSignInPrompt={onSignIn}
            variant="compact"
            title="Upload a resume or choose from saved CVs"
            subtitle="PDF, DOCX, DOC or TXT • Max 10MB"
            primaryActionLabel="Choose File"
            showCurrentCVBadge={true}
          />
        </div>

        {/* Step 2 & 3: Target Job Description & Check Match (Embedded JobMatchView) */}
        <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80">
          <JobMatchView
            key={`job-match-engine-${matchKey}`}
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
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Next Step: Verify Document Format</span>
            </div>
            <h3 className="text-base font-bold text-white">Ensure Clean ATS Parseability &amp; Structure</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              After aligning your skills with the job description, run our <strong>Free ATS Resume Checker</strong> to ensure file layout, date formats, section titles, and action verbs pass recruiter screening bots.
            </p>
          </div>

          <button
            onClick={onOpenATSChecker}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
            id="job_match_page_to_ats_btn"
          >
            <span>Scan Resume Parseability</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* 4. Educational & SEO Content Section (Strictly below the functional tool) */}
      <section className="px-4 md:px-12 py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* How the Evaluation Engine Works */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Algorithmic Scoring</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How Our Resume Job Match Engine Evaluates Alignment
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Our engine compares your CV against vacancy descriptions across 5 core criteria:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              
              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">1. Hard &amp; Soft Skills Match</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/40">35% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts explicit technologies, frameworks, certifications, and methods mentioned in the vacancy, comparing them against your listed skills and experience items.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">2. Experience Alignment</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/40">25% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates whether your past job responsibilities and day-to-day duties align with the core day-to-day duties detailed in the target role overview.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">3. Priority Keyword Coverage</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/40">20% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Differentiates between Required vs Preferred keywords and verifies that high-frequency terms appear in meaningful context throughout your CV.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">4. Role Level &amp; Relevance</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/40">10% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks seniority matching (Junior, Mid, Senior, Lead, Executive) and confirms the scope of your past achievements reflects the expected ownership level.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">5. Education &amp; Credentials</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/40">10% Weight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verifies degree requirements (B.S., M.S., or equivalent experience) and specialized industry licenses requested in the posting.
                </p>
              </div>

              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Strengths &amp; Gaps</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">Actionable</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Highlights your competitive advantages while clearly outlining missing requirements with honest recommendations on how to address them.
                </p>
              </div>

            </div>
          </div>

          {/* How to Tailor Without Hallucinations */}
          <div className="border-t border-slate-800 pt-12 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ethical Tailoring</span>
              <h2 className="text-2xl font-bold text-white">How to Tailor Your CV Without Keyword Stuffing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white">Contextual Placement</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never append a hidden list of buzzwords. Incorporate target skills naturally inside your work experience bullet points alongside measurable business impact.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white">Reorder for Relevance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Move projects and bullet points that demonstrate the job&apos;s most critical requirements toward the top of each employment entry where recruiters see them first.
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white">Address Skill Gaps Honestly</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If you haven&apos;t used a specific tool, highlight adjacent technologies or mention ongoing learning in your cover letter rather than claiming unverified mastery.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Frequently Asked Questions (FAQ) */}
          <div className="border-t border-slate-800 pt-12 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">FAQ</span>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto text-xs">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>What is a good Job Match score?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  A score of 75% or higher indicates strong alignment with the job posting. Employers rarely require a 100% match, as postings often combine essential requirements with &ldquo;nice to have&rdquo; wish-list skills.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Does tailoring my CV mean making things up?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  No. ProCVMaker strictly enforces a zero-hallucination policy. Tailoring means rephrasing your authentic career experience using the terminology preferred by the employer, spotlighting relevant achievements and reprioritizing bullet points.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Can I save tailored versions of my resume?</span>
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Yes. Signed-in users can duplicate their CVs, customize one version for each specific target position, and store up to 20 different tailored resumes in cloud storage.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="p-8 bg-gradient-to-tr from-teal-950/40 via-slate-900 to-slate-950 border border-teal-800/40 rounded-3xl text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Ready to Customize Your Resume?</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Apply tailored suggestions directly into your CV and export a clean, ATS-friendly PDF ready for job applications.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onStartBuilding}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2"
                id="job_match_page_bottom_builder_btn"
              >
                <span>Open CV Editor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenATSChecker}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer border border-slate-700"
              >
                <span>Check ATS Compatibility</span>
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
          <p>&copy; 2026 ProCVMaker. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Zero hallucinations &bull; Authentic career tailoring</p>
        </div>
      </footer>

    </div>
  );
};
