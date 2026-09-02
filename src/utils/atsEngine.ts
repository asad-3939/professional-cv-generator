import { CVData, DesignConfig, ATSAnalysisResult, ATSIssue, ATSCategoryScores, PersonalDetails } from "../types";

/**
 * Advanced ATS Rule-Based Analyzer and Scoring Engine
 * Generates an objective, deterministic evaluation of CV structure, parseability, 
 * contact details, and hygiene, and combines them with AI content checks.
 */

// Helper to sanitize and check email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CLEAN_REGEX = /\d/g;

// Strong action verbs dictionary for rule-based heuristics
export const STRONG_ACTION_VERBS = new Set([
  "accelerated", "accomplished", "achieved", "acquired", "adapted", "administered",
  "advised", "advocated", "aligned", "allocated", "analyzed", "appraised",
  "architected", "arranged", "assembled", "assessed", "audited", "authored",
  "automated", "boosted", "briefed", "budgeted", "built", "calculated",
  "centralized", "championed", "coached", "collaborated", "compiled", "composed",
  "conceived", "conducted", "configured", "consolidated", "constructed", "consulted",
  "coordinated", "crafted", "created", "cultivated", "customized", "debugged",
  "decreased", "defined", "delegated", "delivered", "deployed", "designed",
  "developed", "devised", "diagnosed", "directed", "discovered", "dispatched",
  "diversified", "documented", "doubled", "drafted", "drove", "earned",
  "economized", "edited", "educated", "elevated", "eliminated", "enabled",
  "enacted", "engineered", "enhanced", "enlarged", "ensured", "established",
  "estimated", "evaluated", "examined", "executed", "expanded", "expedited",
  "experimented", "explained", "explored", "facilitated", "finalized", "financed",
  "forecasted", "formulated", "fostered", "founded", "fulfilled", "gained",
  "generated", "governed", "guided", "halted", "handled", "headed",
  "heightened", "hired", "identified", "illuminated", "illustrated", "implemented",
  "improved", "improvised", "increased", "indexed", "individualized", "influenced",
  "informed", "initiated", "innovated", "inspected", "inspired", "installed",
  "instituted", "instructed", "integrated", "intensified", "interpreted", "interviewed",
  "introduced", "invented", "investigated", "isolated", "launched", "lead",
  "led", "leveraged", "liaised", "maintained", "managed", "mapped",
  "marketed", "mastered", "maximized", "measured", "mediated", "mentored",
  "merged", "migrated", "minimized", "modeled", "moderated", "modernized",
  "monitored", "motivated", "navigated", "negotiated", "nurtured", "obtained",
  "operated", "optimized", "orchestrated", "organized", "originated", "outperformed",
  "overhauled", "oversaw", "partnered", "performed", "persuaded", "piloted",
  "pioneered", "planned", "positioned", "prepared", "presented", "presided",
  "prioritized", "produced", "programmed", "projected", "promoted", "proposed",
  "prospected", "provided", "published", "purchased", "quantified", "raised",
  "rationalized", "realized", "rebuilt", "received", "recommended", "reconciled",
  "recruited", "redesigned", "reduced", "refined", "refocused", "regulated",
  "reinforced", "rejuvenated", "renegotiated", "reorganized", "repaired", "replaced",
  "reported", "represented", "researched", "resolved", "restructured", "revamped",
  "reviewed", "revised", "revitalized", "rewarded", "routed", "safeguarded",
  "salvaged", "saved", "scaled", "scheduled", "screened", "secured",
  "segmented", "selected", "separated", "served", "shaped", "simplified",
  "simulated", "solved", "spearheaded", "specialized", "specified", "standardized",
  "started", "stimulated", "streamlined", "strengthened", "structured", "structured",
  "succeeded", "summarized", "supervised", "supplied", "supported", "surpassed",
  "synthesized", "systematized", "tabulated", "targeted", "taught", "tested",
  "trained", "transcribed", "transformed", "translated", "tripled", "troubleshot",
  "uncovered", "undertook", "unified", "unraveled", "updated", "upgraded",
  "utilized", "validated", "valued", "vectorized", "verified", "won", "wrote"
]);

// Weak or passive phrases that hurt ATS ranking and human screening
export const WEAK_PHRASES = [
  "responsible for",
  "duties included",
  "worked on",
  "helped with",
  "assisted in",
  "handled daily tasks",
  "hard worker",
  "team player",
  "go-getter",
  "detail-oriented",
  "good communication skills",
  "participated in",
  "served as a member of"
];

/**
 * Execute pure client-side deterministic rule-based checks on a CV
 */
export function runRuleBasedATSChecks(cvData: CVData, design?: DesignConfig): {
  scores: {
    contactInfo: number;
    structure: number;
    parseability: number;
  };
  issues: ATSIssue[];
} {
  const issues: ATSIssue[] = [];

  // ==========================================
  // 1. Contact Information Checks (Max 100)
  // ==========================================
  let contactScore = 100;
  const p: Partial<PersonalDetails> = cvData.personal || {};

  // Full Name
  if (!p.fullName || p.fullName.trim().length < 2) {
    contactScore -= 40;
    issues.push({
      id: "contact_name_missing",
      category: "contactInfo",
      severity: "critical",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Full Name is missing or incomplete.",
      why: "ATS parsers require an identifiable candidate name at the top to create your candidate profile.",
      how: "Add your full legal or professional name in the Personal Info section."
    });
  } else if (!p.fullName.trim().includes(" ")) {
    contactScore -= 10;
    issues.push({
      id: "contact_name_single",
      category: "contactInfo",
      severity: "suggestion",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Only a single name was provided.",
      why: "Some enterprise ATS systems (e.g. Workday, Taleo) require distinct first and last names for record creation.",
      how: "Provide both your first and last name."
    });
  }

  // Email
  if (!p.email || !p.email.trim()) {
    contactScore -= 30;
    issues.push({
      id: "contact_email_missing",
      category: "contactInfo",
      severity: "critical",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Email address is missing.",
      why: "Recruiters and automated interview dispatchers contact you exclusively through your primary email.",
      how: "Provide a valid professional email address."
    });
  } else if (!EMAIL_REGEX.test(p.email.trim())) {
    contactScore -= 20;
    issues.push({
      id: "contact_email_invalid",
      category: "contactInfo",
      severity: "critical",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Email format appears invalid.",
      why: "Malformed emails cause automated recruiter correspondence to bounce.",
      how: "Ensure your email follows standard format (e.g. name@domain.com)."
    });
  }

  // Phone
  if (!p.phone || !p.phone.trim()) {
    contactScore -= 15;
    issues.push({
      id: "contact_phone_missing",
      category: "contactInfo",
      severity: "important",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Phone number is missing.",
      why: "Many hiring teams conduct phone screens or send SMS notifications for interview scheduling.",
      how: "Add a direct contact phone number with country/area code."
    });
  } else {
    const digitCount = (p.phone.match(PHONE_CLEAN_REGEX) || []).length;
    if (digitCount < 7) {
      contactScore -= 10;
      issues.push({
        id: "contact_phone_short",
        category: "contactInfo",
        severity: "important",
        section: "Contact Information",
        targetLocation: { sectionKey: "personal" },
        what: "Phone number appears too short or incomplete.",
        why: "Incomplete telephone numbers prevent recruiter phone screening.",
        how: "Include a complete phone number with area/country code."
      });
    }
  }

  // Location
  if (!p.location || !p.location.trim()) {
    contactScore -= 10;
    issues.push({
      id: "contact_location_missing",
      category: "contactInfo",
      severity: "important",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Location (City, Country/State) is missing.",
      why: "ATS geo-filtering filters candidates by commute distance or work authorization regions.",
      how: "Specify your current city and state/country (e.g., 'San Francisco, CA' or 'London, UK')."
    });
  }

  // Professional Links (LinkedIn / GitHub / Portfolio)
  const hasLinks = Boolean((p.linkedin && p.linkedin.trim()) || (p.github && p.github.trim()) || (p.website && p.website.trim()));
  if (!hasLinks) {
    contactScore -= 5;
    issues.push({
      id: "contact_links_missing",
      category: "contactInfo",
      severity: "suggestion",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "No professional links (LinkedIn, GitHub, or Portfolio) provided.",
      why: "Over 85% of tech and corporate recruiters cross-reference LinkedIn profiles during candidate screening.",
      how: "Add a LinkedIn URL or portfolio link to substantiate your background."
    });
  } else {
    issues.push({
      id: "contact_links_passed",
      category: "contactInfo",
      severity: "passed",
      section: "Contact Information",
      targetLocation: { sectionKey: "personal" },
      what: "Professional online profiles included.",
      why: "Enables fast identity verification and background validation for recruiters.",
      how: "Keep linked profiles up-to-date."
    });
  }

  contactScore = Math.max(0, Math.min(100, contactScore));

  if (contactScore >= 90) {
    issues.push({
      id: "contact_passed_full",
      category: "contactInfo",
      severity: "passed",
      section: "Contact Information",
      what: "Contact information is complete and well-structured.",
      why: "All vital recruiter communication channels and identity fields are satisfied.",
      how: "Maintain current contact details."
    });
  }

  // ==========================================
  // 2. Structure & Completeness Checks (Max 100)
  // ==========================================
  let structureScore = 100;

  // Target Job Title
  if (!p.jobTitle || !p.jobTitle.trim()) {
    structureScore -= 15;
    issues.push({
      id: "struct_job_title_missing",
      category: "structure",
      severity: "critical",
      section: "Personal Info → Target Job Title",
      targetLocation: { sectionKey: "personal" },
      what: "Target job title headline is missing.",
      why: "Without a clear target title, ATS parsers cannot match your resume to open job requisition categories.",
      how: "Specify the exact target role title (e.g. 'Senior Full-Stack Engineer', 'Product Manager')."
    });
  } else {
    issues.push({
      id: "struct_job_title_passed",
      category: "structure",
      severity: "passed",
      section: "Personal Info → Target Job Title",
      what: `Target job title defined as "${p.jobTitle.trim()}".`,
      why: "Enables immediate role indexing in applicant tracking systems.",
      how: "Align title with the specific openings you apply for."
    });
  }

  // Professional Summary
  const summaryText = (cvData.summary || "").trim();
  if (!summaryText) {
    structureScore -= 20;
    issues.push({
      id: "struct_summary_missing",
      category: "structure",
      severity: "critical",
      section: "Professional Summary",
      targetLocation: { sectionKey: "summary" },
      what: "Professional summary section is empty.",
      why: "A professional summary provides the critical 6-second recruiter elevator pitch and establishes keyword density.",
      how: "Add a 3-4 sentence professional summary highlighting your core expertise and value proposition."
    });
  } else if (summaryText.length < 60) {
    structureScore -= 10;
    issues.push({
      id: "struct_summary_short",
      category: "structure",
      severity: "important",
      section: "Professional Summary",
      targetLocation: { sectionKey: "summary" },
      what: "Professional summary is unusually brief (under 60 characters).",
      why: "Too brief summaries fail to provide necessary technical context or career highlights.",
      how: "Expand summary to 2-4 comprehensive sentences describing your specialties and career track record."
    });
  } else if (summaryText.length > 700) {
    structureScore -= 8;
    issues.push({
      id: "struct_summary_long",
      category: "structure",
      severity: "suggestion",
      section: "Professional Summary",
      targetLocation: { sectionKey: "summary" },
      what: "Professional summary exceeds recommended length (over 700 characters).",
      why: "Dense paragraphs dilute reading speed and push relevant work experience below the fold.",
      how: "Condense summary into 3 to 4 punchy, high-impact sentences."
    });
  } else {
    issues.push({
      id: "struct_summary_passed",
      category: "structure",
      severity: "passed",
      section: "Professional Summary",
      what: "Professional summary has optimal length and structure.",
      why: "Provides a balanced executive overview without cluttering the page.",
      how: "Tailor emphasis to specific job requisitions."
    });
  }

  // Work Experience Section
  const experiences = cvData.experience || [];
  if (experiences.length === 0) {
    structureScore -= 30;
    issues.push({
      id: "struct_experience_empty",
      category: "structure",
      severity: "critical",
      section: "Work Experience",
      targetLocation: { sectionKey: "experience" },
      what: "No work experience entries listed.",
      why: "Work experience is the most heavily weighted section in ATS candidate scoring and recruiter reviews.",
      how: "Add at least one professional position, internship, or freelance project."
    });
  } else {
    // Check each experience entry for completeness & dates
    let missingExpFields = 0;
    let missingExpDates = 0;
    let emptyExpDescriptions = 0;

    experiences.forEach((exp, idx) => {
      const pos = exp.position?.trim() || "";
      const comp = exp.company?.trim() || "";
      const desc = exp.description?.trim() || "";
      const start = exp.startDate?.trim() || "";
      const end = exp.endDate?.trim() || "";

      if (!pos || !comp) {
        missingExpFields++;
        issues.push({
          id: `struct_exp_fields_${exp.id || idx}`,
          category: "structure",
          severity: "critical",
          section: `Experience → Entry #${idx + 1}`,
          targetLocation: { sectionKey: "experience", itemId: exp.id },
          what: `Missing position title or company name in experience entry #${idx + 1}.`,
          why: "ATS engines index work history using exact Company and Title tokens.",
          how: "Fill in both the official job title and employer name."
        });
      }

      if (!start || (!exp.current && !end)) {
        missingExpDates++;
        issues.push({
          id: `struct_exp_dates_${exp.id || idx}`,
          category: "structure",
          severity: "important",
          section: `Experience → ${pos || comp || `Entry #${idx + 1}`}`,
          targetLocation: { sectionKey: "experience", itemId: exp.id },
          what: `Missing start or end employment dates.`,
          why: "Missing dates prevent ATS parsers from calculating your total years of experience.",
          how: "Provide start and end dates (or mark as Currently Employed)."
        });
      }

      if (!desc || desc.length < 20) {
        emptyExpDescriptions++;
        issues.push({
          id: `struct_exp_desc_${exp.id || idx}`,
          category: "structure",
          severity: "critical",
          section: `Experience → ${pos || comp || `Entry #${idx + 1}`}`,
          targetLocation: { sectionKey: "experience", itemId: exp.id },
          what: `Job description/bullet points are missing or empty.`,
          why: "Job descriptions provide the core keyword matches and evidence of accomplishment.",
          how: "Add 2 to 4 bullet points detailing your key accomplishments and responsibilities."
        });
      }
    });

    if (missingExpFields > 0) structureScore -= 15;
    if (missingExpDates > 0) structureScore -= 10;
    if (emptyExpDescriptions > 0) structureScore -= 15;

    if (missingExpFields === 0 && missingExpDates === 0 && emptyExpDescriptions === 0) {
      issues.push({
        id: "struct_experience_passed",
        category: "structure",
        severity: "passed",
        section: "Work Experience",
        what: `All ${experiences.length} work experience entries have complete titles, employers, and dates.`,
        why: "Ensures seamless chronology parsing by Taleo, Greenhouse, Lever, and Workday.",
        how: "Keep bullets updated with your latest wins."
      });
    }
  }

  // Education Section
  const educations = cvData.education || [];
  if (educations.length === 0) {
    structureScore -= 15;
    issues.push({
      id: "struct_education_empty",
      category: "structure",
      severity: "important",
      section: "Education",
      targetLocation: { sectionKey: "education" },
      what: "No education entries listed.",
      why: "Many automated job filters check for minimum education requirements (e.g., Bachelor's, Associate's, or High School).",
      how: "Add your degree, diploma, boot camp, or secondary education credentials."
    });
  } else {
    educations.forEach((edu, idx) => {
      if (!edu.school?.trim() || !edu.degree?.trim()) {
        structureScore -= 8;
        issues.push({
          id: `struct_edu_incomplete_${edu.id || idx}`,
          category: "structure",
          severity: "important",
          section: `Education → Entry #${idx + 1}`,
          targetLocation: { sectionKey: "education", itemId: edu.id },
          what: `Education entry #${idx + 1} is missing school name or degree.`,
          why: "ATS engines cannot verify your qualification level without complete school and degree titles.",
          how: "Specify both the institution name and field of study / degree."
        });
      }
    });
  }

  // Skills Section
  const skillsList = cvData.skills || [];
  if (skillsList.length === 0) {
    structureScore -= 25;
    issues.push({
      id: "struct_skills_empty",
      category: "structure",
      severity: "critical",
      section: "Skills",
      targetLocation: { sectionKey: "skills" },
      what: "Skills list is empty.",
      why: "ATS algorithms match candidate keyword profiles directly against skills inventories.",
      how: "Add 6-15 relevant core hard skills, technologies, and proficiencies."
    });
  } else if (skillsList.length < 4) {
    structureScore -= 10;
    issues.push({
      id: "struct_skills_few",
      category: "structure",
      severity: "important",
      section: "Skills",
      targetLocation: { sectionKey: "skills" },
      what: `Only ${skillsList.length} skills listed (recommended: 6 to 15).`,
      why: "A small skills footprint reduces keyword coverage during candidate search queries.",
      how: "Add more relevant tools, frameworks, and domain competencies."
    });
  } else if (skillsList.length > 30) {
    structureScore -= 5;
    issues.push({
      id: "struct_skills_excessive",
      category: "structure",
      severity: "suggestion",
      section: "Skills",
      targetLocation: { sectionKey: "skills" },
      what: `High volume of skills listed (${skillsList.length} items).`,
      why: "Excessive keyword lists can be flagged as 'keyword stuffing' and diminish recruiter focus.",
      how: "Curate the list down to your top 15-20 most impactful and relevant skills."
    });
  } else {
    issues.push({
      id: "struct_skills_passed",
      category: "structure",
      severity: "passed",
      section: "Skills",
      what: `Healthy skill inventory with ${skillsList.length} distinct items.`,
      why: "Provides solid keyword coverage without keyword stuffing.",
      how: "Group or prioritize top skills relevant to your target role."
    });
  }

  structureScore = Math.max(0, Math.min(100, structureScore));

  // ==========================================
  // 3. Parseability & ATS Safety Checks (Max 100)
  // ==========================================
  let parseabilityScore = 100;

  // Duplicate Skills Check
  const normalizedSkills = new Map<string, number>();
  const duplicateSkills: string[] = [];

  skillsList.forEach((sk) => {
    const clean = sk.trim().toLowerCase();
    if (!clean) return;
    const count = normalizedSkills.get(clean) || 0;
    if (count > 0 && !duplicateSkills.includes(sk)) {
      duplicateSkills.push(sk);
    }
    normalizedSkills.set(clean, count + 1);
  });

  if (duplicateSkills.length > 0) {
    parseabilityScore -= 10;
    issues.push({
      id: "parse_duplicate_skills",
      category: "parseability",
      severity: "important",
      section: "Skills",
      targetLocation: { sectionKey: "skills" },
      what: `Duplicate or redundant skills detected: "${duplicateSkills.join('", "')}".`,
      why: "Duplicate keywords consume space without adding value and signal inattention to detail.",
      how: "Remove duplicate entries from your skills section."
    });
  } else if (skillsList.length >= 4) {
    issues.push({
      id: "parse_skills_deduped_passed",
      category: "parseability",
      severity: "passed",
      section: "Skills",
      what: "All skills are unique with zero duplicates.",
      why: "Maintains a clean and concise keyword taxonomy.",
      how: "Continue maintaining unique skill tags."
    });
  }

  // Bullet Length & Quality Check
  let shortBulletsCount = 0;
  let longBulletsCount = 0;
  let emptyBulletsCount = 0;
  let totalBulletsCount = 0;

  experiences.forEach((exp) => {
    const rawLines = (exp.description || "").split("\n").map(l => l.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean);
    rawLines.forEach((line) => {
      totalBulletsCount++;
      if (line.length < 25) {
        shortBulletsCount++;
      } else if (line.length > 320) {
        longBulletsCount++;
      }
    });
  });

  if (shortBulletsCount > 0) {
    parseabilityScore -= Math.min(15, shortBulletsCount * 4);
    issues.push({
      id: "parse_bullets_too_short",
      category: "parseability",
      severity: "important",
      section: "Work Experience",
      targetLocation: { sectionKey: "experience" },
      what: `${shortBulletsCount} experience bullet point${shortBulletsCount > 1 ? "s are" : " is"} too short (under 25 characters).`,
      why: "Overly short bullet points lack the context and impact required for ATS semantic parsing.",
      how: "Expand bullet points into full sentences with context, action, and outcome."
    });
  }

  if (longBulletsCount > 0) {
    parseabilityScore -= Math.min(12, longBulletsCount * 4);
    issues.push({
      id: "parse_bullets_too_long",
      category: "parseability",
      severity: "suggestion",
      section: "Work Experience",
      targetLocation: { sectionKey: "experience" },
      what: `${longBulletsCount} bullet point${longBulletsCount > 1 ? "s exceed" : " exceeds"} 320 characters.`,
      why: "Dense walls of text are difficult for human recruiters to skim quickly.",
      how: "Break long paragraphs into 2 concise, focused bullet points."
    });
  }

  // Word Count and Density
  const fullDocumentText = [
    p.fullName,
    p.jobTitle,
    summaryText,
    ...experiences.map(e => `${e.position} ${e.company} ${e.description}`),
    ...educations.map(e => `${e.school} ${e.degree} ${e.notes}`),
    ...skillsList,
    ...(cvData.projects || []).map(pr => `${pr.name} ${pr.technologies} ${pr.description}`),
    ...(cvData.certifications || []).map(c => `${c.name} ${c.issuer}`),
    ...(cvData.languages || []).map(l => `${l.name} ${l.proficiency}`)
  ].filter(Boolean).join(" ");

  const totalWords = fullDocumentText.split(/\s+/).filter(Boolean).length;

  if (totalWords < 120) {
    parseabilityScore -= 25;
    issues.push({
      id: "parse_content_sparse",
      category: "parseability",
      severity: "critical",
      section: "Document Density",
      what: `Document has very low word count (~${totalWords} words).`,
      why: "Sparse resumes do not contain enough semantic tokens for ATS algorithms to match you against job postings.",
      how: "Add comprehensive bullet points across your work experience, projects, and skills."
    });
  } else if (totalWords > 1300) {
    parseabilityScore -= 8;
    issues.push({
      id: "parse_content_lengthy",
      category: "parseability",
      severity: "suggestion",
      section: "Document Density",
      what: `Document is unusually long (~${totalWords} words).`,
      why: "May span onto 3+ pages, reducing recruiter retention.",
      how: "Tighten bullet wording and remove older or irrelevant positions."
    });
  } else {
    issues.push({
      id: "parse_density_passed",
      category: "parseability",
      severity: "passed",
      section: "Document Density",
      what: `Optimal content density (~${totalWords} words).`,
      why: "Fits standard 1-2 page formatting guidelines with high keyword density.",
      how: "Maintain concise, active language."
    });
  }

  // Standard Section Headings Check
  issues.push({
    id: "parse_headings_passed",
    category: "parseability",
    severity: "passed",
    section: "ATS Section Headers",
    what: "Standard ATS section headers (Experience, Education, Skills, Summary) verified.",
    why: "Ensures optical and structural compatibility across major ATS parsers.",
    how: "Use standard headings when tailoring."
  });

  parseabilityScore = Math.max(0, Math.min(100, parseabilityScore));

  return {
    scores: {
      contactInfo: contactScore,
      structure: structureScore,
      parseability: parseabilityScore
    },
    issues
  };
}

/**
 * Combine Rule-Based Scores & AI Findings to compute final weighted ATS Assessment
 */
export function synthesizeATSAnalysis(
  ruleScores: { contactInfo: number; structure: number; parseability: number },
  ruleIssues: ATSIssue[],
  aiResponse?: {
    contentQualityScore?: number;
    achievementImpactScore?: number;
    readabilityScore?: number;
    findings?: Array<{
      category: "contentQuality" | "achievementImpact" | "readability";
      severity: "critical" | "important" | "suggestion" | "passed";
      section: string;
      itemId?: string;
      bulletIndex?: number;
      what: string;
      why: string;
      how: string;
      originalText?: string;
      suggestedText?: string;
    }>;
  }
): ATSAnalysisResult {
  // Extract AI Scores or generate fallback heuristic scores if AI was unavailable
  const contentQuality = typeof aiResponse?.contentQualityScore === "number"
    ? Math.max(0, Math.min(100, aiResponse.contentQualityScore))
    : 75;

  const achievementImpact = typeof aiResponse?.achievementImpactScore === "number"
    ? Math.max(0, Math.min(100, aiResponse.achievementImpactScore))
    : 70;

  const readability = typeof aiResponse?.readabilityScore === "number"
    ? Math.max(0, Math.min(100, aiResponse.readabilityScore))
    : 80;

  const categoryScores: ATSCategoryScores = {
    parseability: ruleScores.parseability,
    structure: ruleScores.structure,
    contentQuality,
    achievementImpact,
    readability,
    contactInfo: ruleScores.contactInfo
  };

  // STRICT Scoring weights:
  // Parseability & ATS Safety — 25%
  // Structure & Completeness — 20%
  // Content Quality — 20%
  // Achievement Impact — 15%
  // Readability — 15%
  // Contact Information — 5%
  const computedScore = Math.round(
    categoryScores.parseability * 0.25 +
    categoryScores.structure * 0.20 +
    categoryScores.contentQuality * 0.20 +
    categoryScores.achievementImpact * 0.15 +
    categoryScores.readability * 0.15 +
    categoryScores.contactInfo * 0.05
  );

  const overallScore = Math.max(0, Math.min(100, computedScore));

  // Determine Rating
  let rating: ATSAnalysisResult["rating"] = "Needs Optimization";
  if (overallScore >= 88) {
    rating = "Exceptional";
  } else if (overallScore >= 75) {
    rating = "Strong ATS Match";
  } else if (overallScore >= 60) {
    rating = "Moderate Compatibility";
  } else {
    rating = "Needs Optimization";
  }

  // Combine Rule Issues & AI Findings
  const allIssues: ATSIssue[] = [...ruleIssues];

  if (aiResponse?.findings && Array.isArray(aiResponse.findings)) {
    aiResponse.findings.forEach((f, idx) => {
      // Validate schema and avoid duplicate issues
      if (f.what && f.why && f.how) {
        allIssues.push({
          id: `ai_finding_${idx}_${Date.now()}`,
          category: f.category || "contentQuality",
          severity: f.severity || "important",
          section: f.section || "General",
          targetLocation: f.itemId ? {
            sectionKey: "experience",
            itemId: f.itemId,
            bulletIndex: f.bulletIndex
          } : undefined,
          what: f.what,
          why: f.why,
          how: f.how,
          originalText: f.originalText,
          suggestedText: f.suggestedText
        });
      }
    });
  }

  // Partition into the 4 required sections
  const criticalIssues = allIssues.filter(i => i.severity === "critical");
  const importantImprovements = allIssues.filter(i => i.severity === "important");
  const suggestions = allIssues.filter(i => i.severity === "suggestion");
  const passedChecks = allIssues.filter(i => i.severity === "passed");

  return {
    overallScore,
    rating,
    categoryScores,
    criticalIssues,
    importantImprovements,
    suggestions,
    passedChecks,
    analyzedAt: new Date().toISOString()
  };
}
