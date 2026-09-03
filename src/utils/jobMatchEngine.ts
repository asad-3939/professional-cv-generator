import { 
  CVData, 
  JobMatchResult, 
  JobMatchCategoryScores, 
  SkillMatchItem, 
  KeywordMatchItem, 
  JobGapItem, 
  JobStrengthItem, 
  JobContentImprovement,
  KeywordPriority 
} from "../types";

// Common tech & professional keywords taxonomy
const COMMON_SKILLS_DICTIONARY = [
  // Languages & Core
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Golang", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL", "HTML", "CSS", "R", "Scala", "Dart", "Bash", "Shell",
  // Frontend
  "React", "React.js", "Next.js", "Vue", "Vue.js", "Angular", "Svelte", "Redux", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Webpack", "Vite", "GraphQL", "REST API", "Responsive Design",
  // Backend & Cloud
  "Node.js", "Express", "Express.js", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Ruby on Rails", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Firebase", "Firestore", "Cloud SQL", "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "GitHub Actions", "Terraform", "Kafka", "RabbitMQ", "Microservices", "Serverless",
  // AI & Data
  "Machine Learning", "Deep Learning", "LLM", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Data Analysis", "Data Visualization", "Tableau", "Power BI", "Spark", "Hadoop", "ETL",
  // Product, Design & Management
  "Agile", "Scrum", "Kanban", "Jira", "Figma", "UI/UX", "User Research", "Wireframing", "Product Management", "Roadmapping", "A/B Testing", "SEO", "Analytics", "Stakeholder Management", "Team Leadership", "Mentoring", "Code Review", "Unit Testing", "Jest", "Cypress", "Playwright", "TDD"
];

/**
 * Generate quick hash for job description + cv updatedAt for caching/staleness
 */
export function generateJobMatchKey(cvTitle: string, jobDescription: string): string {
  let hash = 0;
  const str = `${cvTitle}::${jobDescription.trim()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `jm_${Math.abs(hash)}`;
}

/**
 * Extract candidate text corpus from all CV fields
 */
export function getCandidateFullText(cvData: CVData): string {
  const parts: string[] = [];

  if (cvData.personal?.fullName) parts.push(cvData.personal.fullName);
  if (cvData.personal?.jobTitle) parts.push(cvData.personal.jobTitle);
  if (cvData.summary) parts.push(cvData.summary);

  if (Array.isArray(cvData.skills)) {
    parts.push(cvData.skills.join(" "));
  }

  (cvData.experience || []).forEach(exp => {
    if (exp.company) parts.push(exp.company);
    if (exp.position) parts.push(exp.position);
    if (exp.description) parts.push(exp.description);
  });

  (cvData.education || []).forEach(edu => {
    if (edu.school) parts.push(edu.school);
    if (edu.degree) parts.push(edu.degree);
    if (edu.field) parts.push(edu.field);
    if (edu.notes) parts.push(edu.notes);
  });

  (cvData.projects || []).forEach(p => {
    if (p.name) parts.push(p.name);
    if (p.technologies) parts.push(p.technologies);
    if (p.description) parts.push(p.description);
  });

  (cvData.certifications || []).forEach(c => {
    if (c.name) parts.push(c.name);
    if (c.issuer) parts.push(c.issuer);
  });

  return parts.join(" ");
}

/**
 * Deterministic extraction and matching of skills and keywords
 */
export function runDeterministicJobMatch(cvData: CVData, jobDescription: string) {
  const cvText = getCandidateFullText(cvData);
  const cvTextLower = cvText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // Split JD into sections to determine priority
  const requiredSectionRegex = /(?:requirements|qualifications|what you(?:'ll)? need|must have|minimum qualifications|essential skills)([\s\S]*?)(?:preferred|nice to have|bonus|benefits|about us|responsibilities|$)/i;
  const preferredSectionRegex = /(?:preferred|nice to have|bonus|plus|desirable)([\s\S]*?)(?:benefits|about us|responsibilities|what we offer|$)/i;

  const reqMatch = jobDescription.match(requiredSectionRegex);
  const prefMatch = jobDescription.match(preferredSectionRegex);

  const reqSectionText = reqMatch ? reqMatch[1].toLowerCase() : "";
  const prefSectionText = prefMatch ? prefMatch[1].toLowerCase() : "";

  // 1. Detect candidate skills list normalized
  const candidateSkillsSet = new Set((cvData.skills || []).map(s => s.trim().toLowerCase()));

  // 2. Identify mentioned skills from dictionary in JD
  const identifiedSkills: { name: string; priority: KeywordPriority }[] = [];
  const seenSkills = new Set<string>();

  COMMON_SKILLS_DICTIONARY.forEach(skill => {
    const sLower = skill.toLowerCase();
    // Use word boundary check
    const regex = new RegExp(`\\b${escapeRegExp(sLower)}\\b`, "i");
    if (regex.test(jdLower)) {
      if (!seenSkills.has(sLower)) {
        seenSkills.add(sLower);
        let priority: KeywordPriority = "general";
        if (reqSectionText && new RegExp(`\\b${escapeRegExp(sLower)}\\b`, "i").test(reqSectionText)) {
          priority = "required";
        } else if (prefSectionText && new RegExp(`\\b${escapeRegExp(sLower)}\\b`, "i").test(prefSectionText)) {
          priority = "preferred";
        }
        identifiedSkills.push({ name: skill, priority });
      }
    }
  });

  // 3. Match identified skills against candidate CV
  const matchingSkills: SkillMatchItem[] = [];
  const missingSkills: SkillMatchItem[] = [];

  identifiedSkills.forEach(({ name, priority }) => {
    const sLower = name.toLowerCase();
    const inSkillsList = candidateSkillsSet.has(sLower);
    const inCVText = new RegExp(`\\b${escapeRegExp(sLower)}\\b`, "i").test(cvTextLower);

    if (inSkillsList) {
      matchingSkills.push({
        name,
        status: "matched",
        matchType: "exact",
        foundLocation: "Skills Section"
      });
    } else if (inCVText) {
      matchingSkills.push({
        name,
        status: "matched",
        matchType: "exact",
        foundLocation: "Experience / Project Content"
      });
    } else {
      missingSkills.push({
        name,
        status: "missing",
        matchType: "none"
      });
    }
  });

  // Calculate Deterministic Skills Score (0 - 100)
  let skillsScore = 80;
  if (identifiedSkills.length > 0) {
    const matchedCount = matchingSkills.length;
    const totalSkills = identifiedSkills.length;
    skillsScore = Math.min(100, Math.round((matchedCount / totalSkills) * 100));
  }

  // 4. Keyword Extraction & Priority
  const keywordsList: KeywordMatchItem[] = [];
  identifiedSkills.slice(0, 15).forEach(({ name, priority }) => {
    const sLower = name.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(sLower)}\\b`, "gi");
    const jdMatches = jobDescription.match(regex);
    const cvMatches = cvText.match(regex);

    const freqJD = jdMatches ? jdMatches.length : 1;
    const freqCV = cvMatches ? cvMatches.length : 0;

    keywordsList.push({
      keyword: name,
      priority,
      status: freqCV > 0 ? "present" : "missing",
      frequencyInJob: freqJD,
      frequencyInCV: freqCV
    });
  });

  // Calculate Keyword Coverage Score
  let keywordScore = 75;
  if (keywordsList.length > 0) {
    const presentKeywords = keywordsList.filter(k => k.status === "present").length;
    keywordScore = Math.min(100, Math.round((presentKeywords / keywordsList.length) * 100));
  }

  // 5. Experience Years Check
  let experienceScore = 75;
  const expMatch = jobDescription.match(/(\d+)\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
  let requiredYears = 0;
  if (expMatch && expMatch[1]) {
    requiredYears = parseInt(expMatch[1], 10);
  }

  // Calculate candidate approximate experience years
  let candidateExpYears = 0;
  (cvData.experience || []).forEach(exp => {
    if (exp.startDate) {
      const startYear = parseInt(exp.startDate.slice(0, 4), 10) || 2020;
      let endYear = new Date().getFullYear();
      if (!exp.current && exp.endDate) {
        endYear = parseInt(exp.endDate.slice(0, 4), 10) || startYear + 1;
      }
      candidateExpYears += Math.max(1, endYear - startYear);
    }
  });

  if (requiredYears > 0) {
    if (candidateExpYears >= requiredYears) {
      experienceScore = 95;
    } else if (candidateExpYears >= requiredYears - 1) {
      experienceScore = 80;
    } else {
      experienceScore = Math.max(40, Math.round((candidateExpYears / requiredYears) * 80));
    }
  }

  // 6. Role & Title Relevance Check
  let roleScore = 70;
  const candidateTitle = cvData.personal?.jobTitle?.toLowerCase() || "";
  const firstLines = jobDescription.slice(0, 300).toLowerCase();
  if (candidateTitle && (firstLines.includes(candidateTitle) || jdLower.includes(candidateTitle))) {
    roleScore = 95;
  } else if (candidateTitle) {
    const words = candidateTitle.split(/\s+/).filter(w => w.length > 3);
    const matchedWords = words.filter(w => jdLower.includes(w));
    if (matchedWords.length > 0) {
      roleScore = 80;
    }
  }

  // 7. Education Check
  let educationScore = 80;
  const requiresDegree = /bachelor|master|phd|degree|b\.s\.|m\.s\./i.test(jdLower);
  const hasDegree = (cvData.education || []).some(edu => /bachelor|master|phd|b\.s\.|m\.s\.|engineer|degree/i.test(`${edu.degree} ${edu.field}`));
  if (requiresDegree) {
    educationScore = hasDegree ? 95 : 60;
  }

  return {
    deterministicScores: {
      skillsMatch: skillsScore,
      experienceAlignment: experienceScore,
      keywordCoverage: keywordScore,
      roleRelevance: roleScore,
      educationAlignment: educationScore
    },
    matchingSkills,
    missingSkills,
    keywords: keywordsList,
    requiredYears,
    candidateExpYears
  };
}

/**
 * Synthesize Deterministic Checks with AI Semantic Match Output
 * Strict anti-hallucination formula: application logic enforces exact category weights:
 * Skills 30%, Experience 25%, Keywords 20%, Role Relevance 15%, Education Alignment 10%
 */
export function synthesizeJobMatchResult(
  ruleResult: ReturnType<typeof runDeterministicJobMatch>,
  aiResponse?: any
): JobMatchResult {
  const dScores = ruleResult.deterministicScores;

  // Extract category scores from AI response or fallback to deterministic rules
  const skillsScore = typeof aiResponse?.categoryScores?.skillsMatch === "number"
    ? aiResponse.categoryScores.skillsMatch
    : typeof aiResponse?.skillsMatchScore === "number"
      ? aiResponse.skillsMatchScore
      : dScores.skillsMatch;

  const expScore = typeof aiResponse?.categoryScores?.experienceAlignment === "number"
    ? aiResponse.categoryScores.experienceAlignment
    : typeof aiResponse?.experienceAlignmentScore === "number"
      ? aiResponse.experienceAlignmentScore
      : dScores.experienceAlignment;

  const kwScore = typeof aiResponse?.categoryScores?.keywordCoverage === "number"
    ? aiResponse.categoryScores.keywordCoverage
    : typeof aiResponse?.keywordCoverageScore === "number"
      ? aiResponse.keywordCoverageScore
      : dScores.keywordCoverage;

  const roleScore = typeof aiResponse?.categoryScores?.roleRelevance === "number"
    ? aiResponse.categoryScores.roleRelevance
    : typeof aiResponse?.roleRelevanceScore === "number"
      ? aiResponse.roleRelevanceScore
      : dScores.roleRelevance;

  const eduScore = typeof aiResponse?.categoryScores?.educationAlignment === "number"
    ? aiResponse.categoryScores.educationAlignment
    : typeof aiResponse?.educationAlignmentScore === "number"
      ? aiResponse.educationAlignmentScore
      : dScores.educationAlignment;

  const categoryScores: JobMatchCategoryScores = {
    skillsMatch: Math.min(100, Math.max(0, Math.round(skillsScore))),
    experienceAlignment: Math.min(100, Math.max(0, Math.round(expScore))),
    keywordCoverage: Math.min(100, Math.max(0, Math.round(kwScore))),
    roleRelevance: Math.min(100, Math.max(0, Math.round(roleScore))),
    educationAlignment: Math.min(100, Math.max(0, Math.round(eduScore)))
  };

  // Compute Overall Score with the required weighted formula:
  // Skills: 30%, Experience: 25%, Keywords: 20%, Role: 15%, Education: 10%
  const overallScore = Math.min(100, Math.max(0, Math.round(
    categoryScores.skillsMatch * 0.30 +
    categoryScores.experienceAlignment * 0.25 +
    categoryScores.keywordCoverage * 0.20 +
    categoryScores.roleRelevance * 0.15 +
    categoryScores.educationAlignment * 0.10
  )));

  // Determine Match Rating
  let matchRating: JobMatchResult["matchRating"] = "Moderate Match";
  if (overallScore >= 85) {
    matchRating = "High Match";
  } else if (overallScore >= 70) {
    matchRating = "Strong Match";
  } else if (overallScore >= 50) {
    matchRating = "Moderate Match";
  } else {
    matchRating = "Low Match";
  }

  // Merge Matching Skills
  const matchingMap = new Map<string, SkillMatchItem>();
  if (Array.isArray(aiResponse?.matchingSkills) && aiResponse.matchingSkills.length > 0) {
    aiResponse.matchingSkills.forEach((s: any) => {
      if (s.name) {
        matchingMap.set(s.name.toLowerCase(), {
          name: s.name,
          status: s.status === "partial" ? "partial" : "matched",
          matchType: s.matchType === "exact" ? "exact" : "semantic",
          foundLocation: s.foundLocation || "CV Content"
        });
      }
    });
  } else {
    ruleResult.matchingSkills.forEach(s => matchingMap.set(s.name.toLowerCase(), s));
  }

  // Merge Missing Skills
  const missingMap = new Map<string, SkillMatchItem>();
  if (Array.isArray(aiResponse?.missingSkills) && aiResponse.missingSkills.length > 0) {
    aiResponse.missingSkills.forEach((s: any) => {
      const name = typeof s === "string" ? s : s.name;
      if (name && !matchingMap.has(name.toLowerCase())) {
        missingMap.set(name.toLowerCase(), {
          name,
          status: "missing",
          matchType: "none",
          category: s.category || undefined
        });
      }
    });
  } else {
    ruleResult.missingSkills.forEach(s => {
      if (!matchingMap.has(s.name.toLowerCase())) {
        missingMap.set(s.name.toLowerCase(), s);
      }
    });
  }

  // Keywords: prefer AI extracted with real frequencies if present, else use ruleResult
  let keywordsList: KeywordMatchItem[] = ruleResult.keywords;
  if (Array.isArray(aiResponse?.keywords) && aiResponse.keywords.length > 0) {
    keywordsList = aiResponse.keywords.map((k: any) => ({
      keyword: k.keyword || "",
      priority: k.priority === "required" || k.priority === "preferred" ? k.priority : "general",
      status: k.status === "present" ? "present" : "missing",
      frequencyInJob: typeof k.frequencyInJob === "number" ? k.frequencyInJob : 1,
      frequencyInCV: typeof k.frequencyInCV === "number" ? k.frequencyInCV : 0
    }));
  }

  // Gaps with strict anti-hallucination wording
  const gaps: JobGapItem[] = [];
  if (Array.isArray(aiResponse?.gaps) && aiResponse.gaps.length > 0) {
    aiResponse.gaps.forEach((g: any, idx: number) => {
      gaps.push({
        id: `gap_${idx}_${Date.now()}`,
        jobRequirement: g.jobRequirement || "Stated job requirement",
        cvStatus: g.cvStatus || "Not demonstrated in current CV",
        recommendation: g.recommendation || "If you have authentic experience with this requirement, add it to the relevant section. If not, do not fabricate it.",
        severity: g.severity === "high" || g.severity === "medium" || g.severity === "low" ? g.severity : "medium"
      });
    });
  } else if (missingMap.size > 0) {
    Array.from(missingMap.values()).slice(0, 3).forEach((ms, idx) => {
      gaps.push({
        id: `gap_auto_${idx}`,
        jobRequirement: `Proficiency with ${ms.name}`,
        cvStatus: `Skill "${ms.name}" is missing from CV`,
        recommendation: `If you have authentic experience with ${ms.name}, highlight it in your Skills or Experience section. If not, do not fabricate it.`,
        severity: "medium"
      });
    });
  }

  // Strengths
  const strengths: JobStrengthItem[] = [];
  if (Array.isArray(aiResponse?.strengths) && aiResponse.strengths.length > 0) {
    aiResponse.strengths.forEach((st: any, idx: number) => {
      strengths.push({
        id: `str_${idx}`,
        title: st.title || "Strong Alignment",
        description: st.description || "",
        evidence: st.evidence || ""
      });
    });
  } else if (matchingMap.size > 0) {
    const matchedNames = Array.from(matchingMap.values()).slice(0, 4).map(s => s.name).join(", ");
    strengths.push({
      id: "str_auto_1",
      title: "Matching Technical Skills",
      description: "Your CV directly demonstrates several required qualifications.",
      evidence: `Found in CV: ${matchedNames}`
    });
  }

  // Content Improvements (Diff proposals)
  const contentImprovements: JobContentImprovement[] = [];
  if (Array.isArray(aiResponse?.contentImprovements)) {
    aiResponse.contentImprovements.forEach((ci: any, idx: number) => {
      if (ci.originalText && ci.suggestedText) {
        contentImprovements.push({
          id: `ci_${idx}_${Date.now()}`,
          section: ci.section || "Experience",
          itemId: ci.itemId,
          originalText: ci.originalText,
          suggestedText: ci.suggestedText,
          explanation: ci.explanation || "Rephrased in active voice to align with job keywords while preserving 100% of candidate facts."
        });
      }
    });
  }

  return {
    overallScore,
    matchRating,
    jobTitle: aiResponse?.jobTitle || aiResponse?.detectedJobTitle || undefined,
    companyName: aiResponse?.companyName || aiResponse?.detectedCompany || undefined,
    categoryScores,
    matchingSkills: Array.from(matchingMap.values()),
    missingSkills: Array.from(missingMap.values()),
    keywords: keywordsList,
    strengths,
    gaps,
    contentImprovements,
    analyzedAt: new Date().toISOString(),
    analysisSource: aiResponse?.analysisSource || (aiResponse ? "gemini-3.8-flash" : "heuristic")
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
