import React, { useState, useEffect } from "react";
import { 
  X, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, 
  RotateCw, Check, ArrowRight, ShieldCheck, FileCheck, 
  BarChart3, Award, Info, ChevronDown, ChevronUp, Layers, Wand2
} from "lucide-react";
import { CVData, DesignConfig, ATSAnalysisResult, ATSIssue, ATSCategoryScores } from "../types";
import { runRuleBasedATSChecks, synthesizeATSAnalysis } from "../utils/atsEngine";

interface ATSAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  designConfig?: DesignConfig;
  cvTitle?: string;
  onUpdateCVData?: (newData: CVData) => void;
}

export const ATSAnalyzerModal: React.FC<ATSAnalyzerModalProps> = ({
  isOpen,
  onClose,
  cvData,
  designConfig,
  cvTitle = "Current Resume",
  onUpdateCVData
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("Initializing audit...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Section filters / tabs
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "important" | "suggestions" | "passed">("all");
  
  // Applied fixes tracking (issue id -> applied boolean)
  const [appliedFixes, setAppliedFixes] = useState<Record<string, boolean>>({});
  
  // Collapsed state for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Run ATS analysis
  const executeAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep("Running rule-based structure and formatting checks...");

    try {
      // Step 1: Run client-side deterministic rule-based checks immediately
      const { scores: ruleScores, issues: ruleIssues } = runRuleBasedATSChecks(cvData, designConfig);

      setAnalysisStep("Evaluating content quality, achievements, and tone with AI...");

      // Step 2: Fetch AI content assessment from server endpoint
      let aiResponse: any = null;
      try {
        const res = await fetch("/api/cv/ats-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cvData })
        });

        if (res.ok) {
          aiResponse = await res.json();
        } else {
          console.warn("AI ATS analysis endpoint returned non-200, falling back to rule synthesis:", res.status);
        }
      } catch (networkErr) {
        console.warn("AI analysis network fetch notice, synthesizing using heuristic rules:", networkErr);
      }

      setAnalysisStep("Synthesizing weighted category scores...");

      // Step 3: Combine Rule Scores & AI Findings
      const synthesized = synthesizeATSAnalysis(ruleScores, ruleIssues, aiResponse);
      setAnalysisResult(synthesized);
    } catch (err: any) {
      console.error("ATS Analysis error:", err);
      setErrorMsg(err.message || "An unexpected error occurred while analyzing the CV.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger analysis automatically when modal opens if not yet analyzed
  useEffect(() => {
    if (isOpen) {
      executeAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle collapsed section
  const toggleSection = (sec: string) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Apply a suggested fix to the CV Data
  const handleApplyFix = (issue: ATSIssue) => {
    if (!onUpdateCVData || !issue.suggestedText) return;

    const updatedCV: CVData = JSON.parse(JSON.stringify(cvData));

    // Case 1: Target is the Professional Summary
    if (issue.section.toLowerCase().includes("summary") || issue.targetLocation?.sectionKey === "summary") {
      updatedCV.summary = issue.suggestedText;
      onUpdateCVData(updatedCV);
      setAppliedFixes(prev => ({ ...prev, [issue.id]: true }));
      return;
    }

    // Case 2: Target is a specific experience bullet
    if (issue.targetLocation?.itemId && issue.targetLocation.sectionKey === "experience") {
      const expIdx = updatedCV.experience.findIndex(e => e.id === issue.targetLocation?.itemId);
      if (expIdx !== -1 && issue.originalText) {
        const exp = updatedCV.experience[expIdx];
        exp.description = exp.description.replace(issue.originalText, issue.suggestedText);
        onUpdateCVData(updatedCV);
        setAppliedFixes(prev => ({ ...prev, [issue.id]: true }));
        return;
      }
    }

    // Case 3: Target matches originalText anywhere in experiences
    if (issue.originalText) {
      let replaced = false;
      for (const exp of updatedCV.experience) {
        if (exp.description.includes(issue.originalText)) {
          exp.description = exp.description.replace(issue.originalText, issue.suggestedText);
          replaced = true;
          break;
        }
      }
      if (replaced) {
        onUpdateCVData(updatedCV);
        setAppliedFixes(prev => ({ ...prev, [issue.id]: true }));
      }
    }
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 88) return "text-emerald-400";
    if (score >= 75) return "text-teal-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 88) return "bg-emerald-500";
    if (score >= 75) return "bg-teal-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getBadgeStyle = (rating: ATSAnalysisResult["rating"]) => {
    switch (rating) {
      case "Exceptional":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
      case "Strong ATS Match":
        return "bg-teal-950/80 text-teal-300 border-teal-800/60";
      case "Moderate Compatibility":
        return "bg-amber-950/80 text-amber-300 border-amber-800/60";
      default:
        return "bg-rose-950/80 text-rose-300 border-rose-800/60";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        id="ats_analyzer_modal_container"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Advanced ATS Analyzer</h2>
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                  Hybrid Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                Analyzing &ldquo;{cvTitle}&rdquo; &bull; Estimated ATS compatibility assessment, not an official score from any specific ATS platform.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={executeAnalysis}
              disabled={isAnalyzing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Re-run ATS Audit"
              id="ats_reanalyze_btn"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-indigo-400" : ""}`} />
              <span>Re-analyze</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              id="ats_modal_close_btn"
              title="Close ATS Analyzer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold">Analysis Warning</strong>
                <span>{errorMsg}</span>
              </div>
              <button 
                onClick={executeAnalysis}
                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 rounded-lg text-xs font-bold text-rose-200 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Running Comprehensive ATS Audit</h3>
                <p className="text-xs text-indigo-400 font-mono animate-pulse">{analysisStep}</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto pt-1">
                  Auditing parseability, layout consistency, action verbs, keyword taxonomy, and recruiter screening factors.
                </p>
              </div>
            </div>
          )}

          {/* Completed Analysis View */}
          {!isAnalyzing && analysisResult && (
            <div className="space-y-6">
              
              {/* Primary Score Banner & Rating */}
              <div className="p-5 sm:p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    ATS Compatibility Assessment
                  </span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl sm:text-5xl font-black tracking-tight ${getScoreColor(analysisResult.overallScore)}`}>
                        {analysisResult.overallScore}
                      </span>
                      <span className="text-slate-500 font-bold text-lg">/100</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeStyle(analysisResult.rating)}`}>
                      {analysisResult.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                    {analysisResult.overallScore >= 85
                      ? "Excellent! Your resume satisfies key ATS parsing rules and has high keyword and achievement density."
                      : analysisResult.overallScore >= 70
                      ? "Strong foundation. Addressing the critical and important suggestions below will maximize recruiter interview conversion."
                      : "Needs optimization. Several sections or formatting details need attention before passing corporate ATS filters."}
                  </p>
                </div>

                {/* Quick Summary Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto shrink-0">
                  <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-center">
                    <span className="text-lg font-black text-rose-400 block">{analysisResult.criticalIssues.length}</span>
                    <span className="text-[10px] text-rose-300/80 font-bold">Critical</span>
                  </div>
                  <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-center">
                    <span className="text-lg font-black text-amber-400 block">{analysisResult.importantImprovements.length}</span>
                    <span className="text-[10px] text-amber-300/80 font-bold">Important</span>
                  </div>
                  <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-center">
                    <span className="text-lg font-black text-blue-400 block">{analysisResult.suggestions.length}</span>
                    <span className="text-[10px] text-blue-300/80 font-bold">Suggestions</span>
                  </div>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-center">
                    <span className="text-lg font-black text-emerald-400 block">{analysisResult.passedChecks.length}</span>
                    <span className="text-[10px] text-emerald-300/80 font-bold">Passed</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Progress Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Category Score Breakdown (Exact Weights)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Weighted to 100 points</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Category 1: Parseability (25%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Parseability & Safety</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">25%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.parseability)}`}>
                          {analysisResult.categoryScores.parseability}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.parseability)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.parseability}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Encodings, headings & formatting hygiene</span>
                  </div>

                  {/* Category 2: Structure (20%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Structure & Sections</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">20%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.structure)}`}>
                          {analysisResult.categoryScores.structure}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.structure)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.structure}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Summary, work history, education & dates</span>
                  </div>

                  {/* Category 3: Content Quality (20%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Content Quality</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">20%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.contentQuality)}`}>
                          {analysisResult.categoryScores.contentQuality}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.contentQuality)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.contentQuality}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Clarity, relevance & active verbs</span>
                  </div>

                  {/* Category 4: Achievement Impact (15%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Achievement Impact</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">15%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.achievementImpact)}`}>
                          {analysisResult.categoryScores.achievementImpact}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.achievementImpact)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.achievementImpact}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Quantified results vs passive tasks</span>
                  </div>

                  {/* Category 5: Readability (15%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Readability & Tone</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">15%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.readability)}`}>
                          {analysisResult.categoryScores.readability}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.readability)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.readability}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Sentence length, repetition & executive tone</span>
                  </div>

                  {/* Category 6: Contact Info (5%) */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Contact Details</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded">5%</span>
                        <span className={`font-black ${getScoreColor(analysisResult.categoryScores.contactInfo)}`}>
                          {analysisResult.categoryScores.contactInfo}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreBg(analysisResult.categoryScores.contactInfo)} transition-all duration-500`}
                        style={{ width: `${analysisResult.categoryScores.contactInfo}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Email, phone, location & profiles</span>
                  </div>

                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  All Items ({analysisResult.criticalIssues.length + analysisResult.importantImprovements.length + analysisResult.suggestions.length + analysisResult.passedChecks.length})
                </button>

                <button
                  onClick={() => setActiveTab("critical")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "critical"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-400 hover:bg-rose-950/30"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Critical Issues ({analysisResult.criticalIssues.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("important")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "important"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-amber-400 hover:bg-amber-950/30"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Important ({analysisResult.importantImprovements.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("suggestions")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "suggestions"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-blue-400 hover:bg-blue-950/30"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Suggestions ({analysisResult.suggestions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("passed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "passed"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-400 hover:bg-emerald-950/30"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passed Checks ({analysisResult.passedChecks.length})</span>
                </button>
              </div>

              {/* Section 1: Critical Issues */}
              {(activeTab === "all" || activeTab === "critical") && (
                <div className="space-y-3">
                  <button 
                    onClick={() => toggleSection("critical")}
                    className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-800/40 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        Critical Issues ({analysisResult.criticalIssues.length})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-normal">Must fix before applying</span>
                    </div>
                    {collapsedSections["critical"] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {!collapsedSections["critical"] && (
                    analysisResult.criticalIssues.length === 0 ? (
                      <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No critical ATS issues detected! Your resume structure meets core baseline standards.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysisResult.criticalIssues.map((issue) => (
                          <IssueCard 
                            key={issue.id} 
                            issue={issue} 
                            isApplied={Boolean(appliedFixes[issue.id])}
                            onApplyFix={() => handleApplyFix(issue)} 
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Section 2: Important Improvements */}
              {(activeTab === "all" || activeTab === "important") && (
                <div className="space-y-3">
                  <button 
                    onClick={() => toggleSection("important")}
                    className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-800/40 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Important Improvements ({analysisResult.importantImprovements.length})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-normal">High impact on ATS match score</span>
                    </div>
                    {collapsedSections["important"] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {!collapsedSections["important"] && (
                    analysisResult.importantImprovements.length === 0 ? (
                      <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No major improvement warnings detected.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysisResult.importantImprovements.map((issue) => (
                          <IssueCard 
                            key={issue.id} 
                            issue={issue} 
                            isApplied={Boolean(appliedFixes[issue.id])}
                            onApplyFix={() => handleApplyFix(issue)} 
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Section 3: Suggestions */}
              {(activeTab === "all" || activeTab === "suggestions") && (
                <div className="space-y-3">
                  <button 
                    onClick={() => toggleSection("suggestions")}
                    className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-800/40 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Suggestions & Polish ({analysisResult.suggestions.length})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-normal">Minor optimizations</span>
                    </div>
                    {collapsedSections["suggestions"] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {!collapsedSections["suggestions"] && (
                    analysisResult.suggestions.length === 0 ? (
                      <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No additional suggestions at this time.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysisResult.suggestions.map((issue) => (
                          <IssueCard 
                            key={issue.id} 
                            issue={issue} 
                            isApplied={Boolean(appliedFixes[issue.id])}
                            onApplyFix={() => handleApplyFix(issue)} 
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Section 4: Passed Checks */}
              {(activeTab === "all" || activeTab === "passed") && (
                <div className="space-y-3">
                  <button 
                    onClick={() => toggleSection("passed")}
                    className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-800/40 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Passed Checks ({analysisResult.passedChecks.length})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-normal">Meets or exceeds ATS standards</span>
                    </div>
                    {collapsedSections["passed"] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {!collapsedSections["passed"] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {analysisResult.passedChecks.map((check) => (
                        <div 
                          key={check.id}
                          className="p-3 bg-slate-950/40 border border-emerald-900/30 rounded-xl flex items-start gap-2.5 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 block">{check.what}</span>
                            <span className="text-[11px] text-slate-400 block">{check.why}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>AI never auto-modifies your CV without your explicit review & approval.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              id="ats_modal_done_btn"
            >
              Done & Return to Editor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Single Issue Card with structured What -> Why -> How + Improve with AI Diff
 */
const IssueCard: React.FC<{
  issue: ATSIssue;
  isApplied: boolean;
  onApplyFix: () => void;
}> = ({ issue, isApplied, onApplyFix }) => {
  const [showDiff, setShowDiff] = useState<boolean>(true);

  const getBorderColor = (sev: ATSIssue["severity"]) => {
    switch (sev) {
      case "critical": return "border-rose-800/40 bg-rose-950/10";
      case "important": return "border-amber-800/40 bg-amber-950/10";
      case "suggestion": return "border-blue-800/40 bg-blue-950/10";
      default: return "border-emerald-800/40 bg-emerald-950/10";
    }
  };

  const getIcon = (sev: ATSIssue["severity"]) => {
    switch (sev) {
      case "critical": return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case "important": return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case "suggestion": return <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
      default: return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getBorderColor(issue.severity)} space-y-3 text-xs transition`}>
      {/* Location / Section Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getIcon(issue.severity)}
          <span className="font-bold text-slate-200">{issue.what}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
          {issue.section}
        </span>
      </div>

      {/* What -> Why -> How Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Why it matters</span>
          <p className="text-slate-300 leading-relaxed">{issue.why}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">How to improve</span>
          <p className="text-slate-300 leading-relaxed">{issue.how}</p>
        </div>
      </div>

      {/* Suggested AI Text Rewrite Diff Box */}
      {issue.suggestedText && (
        <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Suggested Active Voice Polish (Preserves Facts)</span>
            </span>
            {isApplied && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Applied to CV</span>
              </span>
            )}
          </div>

          {issue.originalText && (
            <div className="p-2 bg-slate-900/80 rounded-lg text-slate-400 text-[11px] border border-slate-800">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Original</span>
              <p className="italic line-through opacity-80">&ldquo;{issue.originalText}&rdquo;</p>
            </div>
          )}

          <div className="p-2 bg-indigo-950/30 rounded-lg text-indigo-200 text-xs border border-indigo-900/50">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Recommended Active Rewrite</span>
            <p className="font-medium">&ldquo;{issue.suggestedText}&rdquo;</p>
          </div>

          {!isApplied && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onApplyFix}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Apply to Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
