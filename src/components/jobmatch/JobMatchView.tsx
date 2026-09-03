import React, { useState } from "react";
import { 
  Briefcase, Target, Sparkles, CheckCircle2, AlertTriangle, 
  XCircle, ArrowRight, RotateCw, Check, BookOpen, FileText, 
  CheckCheck, TrendingUp, X, Edit3, ShieldCheck, Info
} from "lucide-react";
import { CVData, JobMatchResult, JobContentImprovement } from "../../types";
import { runDeterministicJobMatch, synthesizeJobMatchResult, generateJobMatchKey } from "../../utils/jobMatchEngine";

export interface JobMatchViewProps {
  cvData: CVData;
  cvTitle?: string;
  onUpdateCVData?: (newData: CVData) => void;
  initialJobDescription?: string;
  onOpenInEditor?: () => void;
  onOpenATSChecker?: () => void;
  inModal?: boolean;
  onClose?: () => void;
}

export const SAMPLE_JOB_DESCRIPTIONS = [
  {
    title: "Senior Full Stack Engineer",
    text: `Job Title: Senior Full Stack Engineer
Location: Remote / Hybrid
Company: TechCorp Solutions

About the Role:
We are seeking an experienced Senior Full Stack Engineer to lead the architecture and development of high-performance web applications.

Requirements & Essential Skills:
- 5+ years of experience building modern web applications with React, TypeScript, and Node.js.
- Strong proficiency in SQL (PostgreSQL / MySQL) and REST API / GraphQL design.
- Hands-on experience with cloud infrastructure (AWS or GCP) and Docker containerization.
- Solid understanding of CI/CD pipelines, automated testing (Jest, Cypress), and Git workflows.
- Experience with Agile/Scrum methodologies and mentoring junior engineers.
- Bachelor's degree in Computer Science, Engineering, or equivalent practical experience.

Preferred Qualifications:
- Experience with Next.js, Redis, Tailwind CSS, or Kubernetes.
- Familiarity with AI/LLM integrations or real-time WebSockets.`
  },
  {
    title: "Frontend Lead Developer",
    text: `Job Title: Frontend Lead Developer
Location: San Francisco, CA / Hybrid

About the Role:
Join our growth team to architect responsive, accessible, and delighting user interfaces.

Requirements:
- 4+ years of professional experience in modern JavaScript/TypeScript and React.js.
- Deep expertise in responsive CSS architectures (Tailwind CSS, CSS-in-JS).
- Proven track record optimizing web performance, Core Web Vitals, and accessibility (WCAG AA).
- Experience leading code reviews, sprint planning, and component library design (Figma to code).
- Degree in Computer Science, Design, or equivalent portfolio experience.

Nice to Have:
- Experience with Next.js, State Management (Redux/Zustand), and Playwright testing.`
  },
  {
    title: "Product Manager (SaaS)",
    text: `Job Title: Product Manager (Growth & Platform)
Location: Remote

Responsibilities:
- Define product vision, roadmaps, and PRDs for core SaaS platform features.
- Partner with engineering, UI/UX designers, and executive stakeholders to prioritize backlogs.
- Run A/B tests, user research interviews, and analyze retention metrics using SQL and analytics dashboards.

Qualifications:
- 3+ years of product management experience in B2B SaaS.
- Strong data analysis skills (SQL, Tableau, Google Analytics, Excel).
- Experience in Agile/Scrum sprint ceremonies and Jira management.
- Strong communication and cross-functional leadership skills.`
  }
];

export const JobMatchView: React.FC<JobMatchViewProps> = ({
  cvData,
  cvTitle = "Current Resume",
  onUpdateCVData,
  initialJobDescription = "",
  onOpenInEditor,
  onOpenATSChecker,
  inModal = false,
  onClose
}) => {
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>("Initializing match...");
  const [analysisResult, setAnalysisResult] = useState<JobMatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "tailoring">("overview");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Record<string, boolean>>({});

  const handleRunAnalysis = async () => {
    // 1. Validate CV Content
    const hasCvContent = Boolean(
      cvData && (
        cvData.personal?.fullName?.trim() ||
        cvData.personal?.jobTitle?.trim() ||
        (cvData.experience && cvData.experience.length > 0) ||
        (cvData.skills && cvData.skills.length > 0) ||
        (cvData.education && cvData.education.length > 0)
      )
    );

    if (!hasCvContent) {
      setErrorMsg("Your selected resume has no content yet. Please enter work experience, skills, or personal info first before comparing against a vacancy.");
      return;
    }

    // 2. Validate Job Description
    if (!jobDescription || jobDescription.trim().length < 20) {
      setErrorMsg("Please paste a complete job description (at least 20 characters) with role requirements to run analysis.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep("Extracting vacancy requirements, skills, and target keywords...");

    try {
      // Step 1: Run client-side deterministic extraction & exact matching
      const ruleResult = runDeterministicJobMatch(cvData, jobDescription);

      setAnalysisStep("Performing deep semantic comparison and gap identification with AI...");

      // Step 2: Fetch AI semantic assessment from server endpoint
      let aiResponse: any = null;
      try {
        const res = await fetch("/api/cv/job-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            cvData, 
            jobDescription: jobDescription.trim() 
          })
        });

        if (res.ok) {
          aiResponse = await res.json();
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn("AI Job match endpoint notice:", errData.error || res.status);
        }
      } catch (fetchErr) {
        console.warn("AI Job match network notice, proceeding with deterministic engine:", fetchErr);
      }

      setAnalysisStep("Calculating weighted match scores and tailoring recommendations...");

      // Step 3: Synthesize deterministic and AI results
      const synthesized = synthesizeJobMatchResult(ruleResult, aiResponse);
      synthesized.jobDescriptionHash = generateJobMatchKey(cvTitle, jobDescription);
      setAnalysisResult(synthesized);
    } catch (err: any) {
      console.error("Job Match error:", err);
      setErrorMsg(err.message || "Failed to compare CV against the job description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyImprovement = (improvement: JobContentImprovement) => {
    if (!onUpdateCVData || !improvement.suggestedText) return;

    const updatedCV: CVData = JSON.parse(JSON.stringify(cvData));

    // Case 1: Target is the Summary
    if (improvement.section.toLowerCase().includes("summary")) {
      updatedCV.summary = improvement.suggestedText;
      onUpdateCVData(updatedCV);
      setAppliedFixes(prev => ({ ...prev, [improvement.id]: true }));
      return;
    }

    // Case 2: Target is in experience with ID
    if (improvement.itemId) {
      const expIdx = updatedCV.experience.findIndex(e => e.id === improvement.itemId);
      if (expIdx !== -1 && improvement.originalText) {
        const exp = updatedCV.experience[expIdx];
        exp.description = exp.description.replace(improvement.originalText, improvement.suggestedText);
        onUpdateCVData(updatedCV);
        setAppliedFixes(prev => ({ ...prev, [improvement.id]: true }));
        return;
      }
    }

    // Case 3: Search text anywhere in experiences
    if (improvement.originalText) {
      let replaced = false;
      for (const exp of updatedCV.experience) {
        if (exp.description.includes(improvement.originalText)) {
          exp.description = exp.description.replace(improvement.originalText, improvement.suggestedText);
          replaced = true;
          break;
        }
      }
      if (replaced) {
        onUpdateCVData(updatedCV);
        setAppliedFixes(prev => ({ ...prev, [improvement.id]: true }));
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-teal-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-teal-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getRatingBadge = (rating: JobMatchResult["matchRating"]) => {
    switch (rating) {
      case "High Match":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
      case "Strong Match":
        return "bg-teal-950/80 text-teal-300 border-teal-800/60";
      case "Moderate Match":
        return "bg-amber-950/80 text-amber-300 border-amber-800/60";
      default:
        return "bg-rose-950/80 text-rose-300 border-rose-800/60";
    }
  };

  return (
    <div className="flex flex-col w-full text-slate-100 font-sans">
      {/* Header */}
      <div className={`px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 ${inModal ? "bg-slate-950/80" : "bg-slate-900/90 rounded-t-2xl"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Job Description → CV Match</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 max-w-[200px] truncate">
                {cvTitle}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Compare your CV against a vacancy to uncover missing requirements, keyword alignment, and tailored gaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInEditor && !inModal && (
            <button
              onClick={onOpenInEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              title="Open this CV in the full editor"
              id="job_match_view_open_editor_btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit CV</span>
            </button>
          )}

          {inModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              id="job_match_modal_close_btn"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body Area */}
      <div className={`p-4 sm:p-6 space-y-6 ${inModal ? "flex-1 overflow-y-auto" : "bg-slate-900 border border-t-0 border-slate-800 rounded-b-2xl"}`}>
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Job Description Input (shown when no result or user requests to change JD) */}
        {!analysisResult && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-teal-400" />
                <span>Target Job Description / Vacancy Posting</span>
              </label>
              <span className="text-[11px] text-slate-400">Paste raw text or load a sample</span>
            </div>

            {/* Sample quick selectors */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 self-center mr-1">Sample Job:</span>
              {SAMPLE_JOB_DESCRIPTIONS.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setJobDescription(sample.text)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 border border-slate-700/80 transition cursor-pointer"
                >
                  {sample.title}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting here (including role summary, required skills, preferred qualifications, responsibilities, and education)..."
                rows={9}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl p-4 text-xs font-sans leading-relaxed text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition resize-y"
                id="job_match_description_textarea"
              />
              {jobDescription.length > 0 && (
                <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                  {jobDescription.length} characters
                </div>
              )}
            </div>

            {/* Anti-hallucination commitment note */}
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Strict Anti-Hallucination Policy: </span>
                We will never invent skills, metrics, or years of experience. Any requirement missing from your CV is transparently highlighted as a gap with safe tailoring recommendations.
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs tracking-tight rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                id="job_match_run_btn"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{analysisStep}</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-slate-950" />
                    <span>Compare &amp; Analyze Match</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results View */}
        {analysisResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Heuristic Fallback Non-Intrusive Notice */}
            {analysisResult.analysisSource === "heuristic" && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/90 border border-slate-800 text-slate-300 rounded-xl text-xs">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Basic analysis mode: AI analysis is temporarily unavailable. Displaying rules-based evaluation.</span>
              </div>
            )}

            {/* Top Banner: Score & Target Role */}
            <div className="p-5 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 flex flex-col items-center justify-center text-center shadow-inner">
                    <span className={`text-2xl font-black tracking-tight ${getScoreColor(analysisResult.overallScore)}`}>
                      {analysisResult.overallScore}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Job Match Score — {analysisResult.overallScore}/100
                    </h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRatingBadge(analysisResult.matchRating)}`}>
                      {analysisResult.matchRating}
                    </span>
                  </div>
                  {analysisResult.jobTitle && (
                    <p className="text-xs text-teal-300 font-medium mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Target Role: {analysisResult.jobTitle}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Calculated from weighted skills, experience depth, keyword coverage, role relevance, and education alignment.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer flex items-center gap-1.5"
                  id="job_match_change_jd_btn"
                >
                  <span>Change Job Posting</span>
                </button>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer flex items-center gap-1.5"
                  id="job_match_reanalyze_btn"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>Re-Analyze</span>
                </button>
              </div>
            </div>

            {/* Sub-Category Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Skills Match (30%) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Skills Match</span>
                  <span className={`font-bold ${getScoreColor(analysisResult.categoryScores.skillsMatch)}`}>
                    {analysisResult.categoryScores.skillsMatch}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBg(analysisResult.categoryScores.skillsMatch)}`} 
                    style={{ width: `${analysisResult.categoryScores.skillsMatch}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">30% Weight</span>
              </div>

              {/* 2. Experience Alignment (25%) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Experience Depth</span>
                  <span className={`font-bold ${getScoreColor(analysisResult.categoryScores.experienceAlignment)}`}>
                    {analysisResult.categoryScores.experienceAlignment}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBg(analysisResult.categoryScores.experienceAlignment)}`} 
                    style={{ width: `${analysisResult.categoryScores.experienceAlignment}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">25% Weight</span>
              </div>

              {/* 3. Keyword Coverage (20%) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Keyword Coverage</span>
                  <span className={`font-bold ${getScoreColor(analysisResult.categoryScores.keywordCoverage)}`}>
                    {analysisResult.categoryScores.keywordCoverage}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBg(analysisResult.categoryScores.keywordCoverage)}`} 
                    style={{ width: `${analysisResult.categoryScores.keywordCoverage}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">20% Weight</span>
              </div>

              {/* 4. Role Relevance (15%) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Role Relevance</span>
                  <span className={`font-bold ${getScoreColor(analysisResult.categoryScores.roleRelevance)}`}>
                    {analysisResult.categoryScores.roleRelevance}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBg(analysisResult.categoryScores.roleRelevance)}`} 
                    style={{ width: `${analysisResult.categoryScores.roleRelevance}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">15% Weight</span>
              </div>

              {/* 5. Education/Reqs (10%) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Education Alignment</span>
                  <span className={`font-bold ${getScoreColor(analysisResult.categoryScores.educationAlignment)}`}>
                    {analysisResult.categoryScores.educationAlignment}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBg(analysisResult.categoryScores.educationAlignment)}`} 
                    style={{ width: `${analysisResult.categoryScores.educationAlignment}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">10% Weight</span>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === "overview"
                    ? "text-teal-400 border-teal-500"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
                id="tab_job_match_overview"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Skills &amp; Gaps Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab("keywords")}
                className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === "keywords"
                    ? "text-teal-400 border-teal-500"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
                id="tab_job_match_keywords"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Keyword Coverage ({analysisResult.keywords.length})</span>
              </button>

              {analysisResult.contentImprovements.length > 0 && (
                <button
                  onClick={() => setActiveTab("tailoring")}
                  className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeTab === "tailoring"
                      ? "text-teal-400 border-teal-500"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                  id="tab_job_match_tailoring"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tailoring Recommendations ({analysisResult.contentImprovements.length})</span>
                </button>
              )}
            </div>

            {/* TAB 1: OVERVIEW & GAPS */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Skills Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matching Skills */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Matching Skills in CV ({analysisResult.matchingSkills.length})</span>
                      </h4>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-semibold">Matched</span>
                    </div>

                    {analysisResult.matchingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.matchingSkills.map((skill, sIdx) => (
                          <span 
                            key={sIdx}
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 font-medium flex items-center gap-1"
                            title={skill.foundLocation ? `Found in: ${skill.foundLocation}` : "Found in CV"}
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{skill.name}</span>
                            {skill.matchType === "semantic" && (
                              <span className="text-[9px] text-emerald-400/70 ml-0.5">(semantic)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No direct matching skills detected from the job description.</p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Missing from CV ({analysisResult.missingSkills.length})</span>
                      </h4>
                      <span className="text-[10px] text-rose-400/80 uppercase font-semibold">Gaps</span>
                    </div>

                    {analysisResult.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.missingSkills.map((skill, sIdx) => (
                          <span 
                            key={sIdx}
                            className="px-2.5 py-1 text-xs rounded-lg bg-rose-950/60 border border-rose-700/50 text-rose-200 font-medium flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{skill.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-300">Great job! All core skills identified in the vacancy are present in your CV.</p>
                    )}
                    <p className="text-[11px] text-slate-400 italic">
                      Do not invent missing skills. Only add them if you genuinely have authentic experience with them.
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                {analysisResult.strengths.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span>Key Alignment Strengths</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.strengths.map((st, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                          <h5 className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>{st.title}</span>
                          </h5>
                          <p className="text-xs text-slate-300 leading-relaxed">{st.description}</p>
                          {st.evidence && (
                            <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">CV Evidence: </span>{st.evidence}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps & Recommended Improvements */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Requirements Gaps &amp; Tailoring Advice</span>
                  </h4>

                  {analysisResult.gaps.length > 0 ? (
                    <div className="space-y-3">
                      {analysisResult.gaps.map((gap, gIdx) => (
                        <div 
                          key={gap.id || gIdx}
                          className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 transition hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-950/80 border border-amber-800/60 text-amber-300">
                                Gap #{gIdx + 1}
                              </span>
                              <h5 className="text-xs font-bold text-white">{gap.jobRequirement}</h5>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                              gap.severity === "high" 
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800/60" 
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}>
                              {gap.severity} Priority
                            </span>
                          </div>

                          {/* Structured What Job Requires -> What CV Shows -> Recommendation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                What CV Currently Shows
                              </span>
                              <p className="text-slate-300">{gap.cvStatus}</p>
                            </div>

                            <div className="p-2.5 bg-teal-950/20 border border-teal-800/40 rounded-lg">
                              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                                How to Improve
                              </span>
                              <p className="text-teal-200/90 leading-relaxed">{gap.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>No significant requirement gaps found for this vacancy.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: KEYWORD COVERAGE */}
            {activeTab === "keywords" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Extracted key terminology from job description categorized by priority and checked against your CV.
                  </span>
                  <span className="text-slate-400 text-[11px] font-bold shrink-0">
                    {analysisResult.keywords.filter(k => k.status === "present").length} / {analysisResult.keywords.length} present
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {analysisResult.keywords.map((kw, kIdx) => {
                    const isPresent = kw.status === "present";
                    const priorityColor = 
                      kw.priority === "required" 
                        ? "border-rose-800/60 text-rose-300 bg-rose-950/40" 
                        : kw.priority === "preferred" 
                          ? "border-teal-800/60 text-teal-300 bg-teal-950/40" 
                          : "border-slate-700 text-slate-300 bg-slate-800/60";

                    return (
                      <div 
                        key={kIdx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isPresent 
                            ? "bg-slate-950/80 border-slate-800" 
                            : "bg-slate-950/40 border-slate-800/60 opacity-80"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{kw.keyword}</span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${priorityColor}`}>
                              {kw.priority}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            In Job: {kw.frequencyInJob}x · In CV: {kw.frequencyInCV}x
                          </span>
                        </div>

                        <div>
                          {isPresent ? (
                            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Found</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded text-[10px] font-bold flex items-center gap-1">
                              <X className="w-3 h-3 text-rose-400" />
                              <span>Missing</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TAILORING & CONTENT IMPROVEMENTS */}
            {activeTab === "tailoring" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-teal-950/20 border border-teal-800/40 rounded-xl text-xs text-teal-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    Safe Fact-Preserving Rewrites: These suggestions rephrase your existing bullet points to align with job keywords without adding any fabricated facts.
                  </span>
                </div>

                <div className="space-y-4">
                  {analysisResult.contentImprovements.map((ci) => {
                    const isApplied = appliedFixes[ci.id];

                    return (
                      <div 
                        key={ci.id}
                        className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">
                            Section: {ci.section}
                          </span>
                          {isApplied && (
                            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              <span>Applied to Resume</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400">{ci.explanation}</p>

                        {/* Side-by-side Diff */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Original in CV
                            </span>
                            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{ci.originalText}</p>
                          </div>

                          <div className="p-3 bg-teal-950/30 border border-teal-800/50 rounded-lg space-y-1">
                            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                              Tailored Active Suggestion
                            </span>
                            <p className="text-teal-200 leading-relaxed font-mono text-[11px]">{ci.suggestedText}</p>
                          </div>
                        </div>

                        {/* Action Button */}
                        {onUpdateCVData && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleApplyImprovement(ci)}
                              disabled={isApplied}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition cursor-pointer flex items-center gap-1.5 ${
                                isApplied
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                  : "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20"
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Apply to Resume</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer */}
      <div className={`px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0 ${inModal ? "" : "rounded-b-2xl"}`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>Job Match compares real requirements without inventing unverifiable claims.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onOpenATSChecker && (
            <button
              onClick={onOpenATSChecker}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>ATS Format Audit</span>
            </button>
          )}

          {onOpenInEditor && (
            <button
              onClick={onOpenInEditor}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
              id="job_match_footer_open_editor_btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{inModal ? "Return to Editor" : "Open in CV Builder"}</span>
            </button>
          )}

          {inModal && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-lg transition cursor-pointer"
              id="job_match_modal_done_btn"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
