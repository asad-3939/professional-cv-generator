export const maxDuration = 60;
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

// Load local environment variables if present
dotenv.config();

// Create the global Express app instance
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize Firebase Admin safely
const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
let db: any = null;

try {
  if (firebaseConfig.projectId) {
    if (getApps().length === 0) {
      initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    db = getFirestore(dbId && dbId !== "(default)" ? dbId : undefined);
  } else {
    console.warn("No Firebase projectId found in configuration.");
  }
} catch (err) {
  console.error("Firebase Admin initialization failed. Backend auth routes will be unavailable:", err);
}

// Password encryption helpers using secure pbkdf2
function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// Custom Authentication Routes using standard Firestore
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    if (!db) {
      res.status(500).json({ error: "Database not initialized on server. Please use client-side authentication." });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const userDocRef = db.collection("users").doc(emailLower);
    const userDoc = await userDocRef.get();


    if (userDoc.exists) {
      res.status(400).json({ error: "This email is already in use. Please sign in instead." });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const userData = {
      email: emailLower,
      fullName: fullName ? fullName.trim() : "",
      salt,
      hash,
      createdAt: new Date().toISOString()
    };

    await userDocRef.set(userData);

    res.json({
      success: true,
      user: {
        email: emailLower,
        displayName: userData.fullName || emailLower,
        uid: emailLower
      }
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: error.message || "Failed to register account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    if (!db) {
      res.status(500).json({ error: "Database not initialized on server. Please use client-side authentication." });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const userDocRef = db.collection("users").doc(emailLower);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      res.status(400).json({ error: "Incorrect email or password. Please try again." });
      return;
    }

    const userData = userDoc.data();
    if (!userData) {
      res.status(400).json({ error: "Incorrect email or password. Please try again." });
      return;
    }
    const match = verifyPassword(password, userData.salt, userData.hash);

    if (!match) {
      res.status(400).json({ error: "Incorrect email or password. Please try again." });
      return;
    }

    res.json({
      success: true,
      user: {
        email: emailLower,
        displayName: userData.fullName || emailLower,
        uid: emailLower
      }
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message || "Authentication process failed." });
  }
});

// Initialize Gemini safely, using lazy checking when routes are called
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

export type AIModelSource = "gemini-3.8-flash" | "gemini-3.5-flash-lite";
export type AnalysisSource = AIModelSource | "heuristic";

export interface SafeGenerationResult {
  response: any;
  analysisSource: AIModelSource;
}

// Check for transient server / network errors that qualify for single retry
function isTransientError(err: any): boolean {
  const status = err?.status || err?.code || err?.statusCode || (err?.error && (err.error.code || err.error.status));
  const msg = (err?.message || String(err)).toLowerCase();

  // Permanent errors: do NOT retry (e.g. invalid key, permissions, malformed requests)
  const isPermanent =
    status === 400 || status === 401 || status === 403 || status === 404 ||
    msg.includes("invalid api key") ||
    msg.includes("api key not valid") ||
    msg.includes("api_key_invalid") ||
    msg.includes("permission_denied") ||
    msg.includes("permissiondenied") ||
    msg.includes("invalid_argument") ||
    msg.includes("invalid argument") ||
    msg.includes("not found") ||
    msg.includes("unregistered callers");

  if (isPermanent) return false;

  // Transient errors: 429, 500, 502, 503, 504, UNAVAILABLE, RESOURCE_EXHAUSTED, high demand / overloaded
  const isTransient =
    status === 429 || status === 500 || status === 502 || status === 503 || status === 504 ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("unavailable") ||
    msg.includes("resource_exhausted") ||
    msg.includes("resourceexhausted") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("spikes in demand") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("timeout") ||
    msg.includes("econnreset");

  return isTransient;
}

// Fallback order: Primary gemini-3.8-flash -> Fallback gemini-3.5-flash-lite
const PRODUCTION_AI_MODELS: AIModelSource[] = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite"
];

async function generateContentSafe(ai: GoogleGenAI, params: any): Promise<SafeGenerationResult> {
  let lastError: any = null;

  for (const model of PRODUCTION_AI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model
        });
        return { response, analysisSource: model };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const transient = isTransientError(err);
        console.warn(`[AI Engine] Model ${model} attempt ${attempt} notice:`, errMsg);

        // Retry once for transient errors (429, 500, 502, 503, 504, UNAVAILABLE, etc.)
        if (transient && attempt < 2) {
          const delay = 650 + Math.floor(Math.random() * 250);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        // Do not retry permanent errors, proceed directly to fallback model
        break;
      }
    }
    // Small delay before trying fallback model
    await new Promise(res => setTimeout(res, 250));
  }

  throw lastError;
}

// Fallback heuristic polisher in case of total AI outage
function ruleBasedPolishText(text: string): string {
  const lines = text.split(/\n+/).map(l => l.replace(/^[-*•\d.]+\s*/, "").trim()).filter(Boolean);
  const verbs = ["Spearheaded", "Architected", "Engineered and delivered", "Optimized", "Streamlined"];
  const polished = lines.slice(0, 4).map((line, idx) => {
    let clean = line;
    clean = clean.replace(/^(responsible for|duties included|worked on|helped with|handled)\s+/i, "");
    const verb = verbs[idx % verbs.length];
    clean = clean.charAt(0).toLowerCase() + clean.slice(1);
    return `- ${verb} ${clean}`;
  });
  return polished.join("\n") || "- Executed and delivered core responsibilities ensuring high standard of quality";
}

// Fallback heuristic summary generator
function ruleBasedSummary(jobTitle: string, skills: string[] = []): string {
  const topSkills = skills.slice(0, 4).join(", ");
  const skillPart = topSkills ? ` with proven expertise in ${topSkills}` : "";
  return `Accomplished and results-driven ${jobTitle}${skillPart}. Demonstrated track record of leading cross-functional initiatives, optimizing workflows, and delivering high-quality solutions. Committed to applying industry best practices and strategic problem-solving to drive organizational success.`;
}

// Fallback heuristic ATS audit generator
function generateHeuristicATSAudit(cv: any) {
  const findings: any[] = [];
  let contentScore = 80;
  let impactScore = 75;
  let readabilityScore = 85;

  const weakWords = [
    { phrase: "responsible for", replace: "Managed and spearheaded" },
    { phrase: "duties included", replace: "Executed core responsibilities including" },
    { phrase: "worked on", replace: "Developed and delivered" },
    { phrase: "helped with", replace: "Contributed to and supported" },
    { phrase: "handled", replace: "Coordinated and oversaw" },
    { phrase: "hard worker", replace: "results-driven professional" },
    { phrase: "team player", replace: "collaborative cross-functional contributor" }
  ];

  // 1. Audit Summary
  if (!cv.summary || cv.summary.trim().length === 0) {
    contentScore -= 15;
    findings.push({
      category: "contentQuality",
      severity: "important",
      section: "Professional Summary",
      what: "Professional summary is empty or missing.",
      why: "Recruiters and ATS parsers scan the summary in the first 6 seconds to identify role fit.",
      how: "Add a 3-4 sentence professional summary highlighting your core expertise and target role."
    });
  } else {
    const summary = cv.summary.trim();
    if (/\b(I|me|my|myself)\b/i.test(summary)) {
      readabilityScore -= 8;
      findings.push({
        category: "readability",
        severity: "suggestion",
        section: "Professional Summary",
        what: "Summary contains first-person personal pronouns (I, my, me).",
        why: "Standard executive resume format expects third-person professional voice without personal pronouns.",
        how: "Rewrite your summary in concise third-person active voice."
      });
    } else {
      findings.push({
        category: "contentQuality",
        severity: "passed",
        section: "Professional Summary",
        what: "Professional summary is written in standard executive tone.",
        why: "Demonstrates professionalism and high readability.",
        how: "Keep it updated with your most notable achievements."
      });
    }
  }

  // 2. Audit Experiences
  let totalBullets = 0;
  let bulletsWithMetrics = 0;

  (cv.experience || []).forEach((exp: any) => {
    if (!exp.description) return;
    const lines = exp.description.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    totalBullets += lines.length;

    lines.forEach((line: string, bIdx: number) => {
      // Check for metrics
      if (/(\d+%|\$\d+|\b\d+\b)/.test(line)) {
        bulletsWithMetrics++;
      } else if (findings.length < 12 && lines.length > 1 && bIdx === 0) {
        impactScore -= 5;
        findings.push({
          category: "achievementImpact",
          severity: "suggestion",
          section: `Experience → ${exp.position || "Role"}`,
          itemId: exp.id,
          bulletIndex: bIdx,
          what: "Bullet point lacks quantifiable outcomes or metrics.",
          why: "Hiring managers look for evidence of impact (e.g., latency reduction, revenue growth, team scale).",
          how: "Add your genuine metrics or percentage improvements if available.",
          originalText: line,
          suggestedText: line
        });
      }

      // Check for weak phrases
      for (const w of weakWords) {
        if (line.toLowerCase().includes(w.phrase)) {
          contentScore -= 4;
          const regex = new RegExp(w.phrase, "i");
          const rewritten = line.replace(regex, w.replace);
          findings.push({
            category: "contentQuality",
            severity: "important",
            section: `Experience → ${exp.position || "Role"}`,
            itemId: exp.id,
            bulletIndex: bIdx,
            what: `Bullet uses passive phrasing ("${w.phrase}").`,
            why: "Passive verbs diminish perceived leadership and ownership of results.",
            how: "Begin with strong action verbs like 'Spearheaded', 'Optimized', or 'Delivered'.",
            originalText: line,
            suggestedText: rewritten
          });
          break;
        }
      }
    });
  });

  if (bulletsWithMetrics > 0) {
    findings.push({
      category: "achievementImpact",
      severity: "passed",
      section: "Work Experience",
      what: `Quantifiable metrics detected across ${bulletsWithMetrics} bullet points.`,
      why: "Measurable metrics stand out to recruiters and validate the scope of your contributions.",
      how: "Continue quantifying outcomes across future projects."
    });
  }

  // 3. Skills Check
  if (!cv.skills || cv.skills.length < 5) {
    contentScore -= 10;
    findings.push({
      category: "contentQuality",
      severity: "important",
      section: "Skills",
      what: "Skills list contains fewer than 5 items.",
      why: "ATS search algorithms rely heavily on skill keyword matching against target job descriptions.",
      how: "Add 8-12 core industry and technical skills relevant to your target role."
    });
  } else {
    findings.push({
      category: "contentQuality",
      severity: "passed",
      section: "Skills",
      what: `Comprehensive skills inventory (${cv.skills.length} skills listed).`,
      why: "Provides strong keyword density for ATS parsing algorithms.",
      how: "Ensure top skills align with your target job vacancies."
    });
  }

  return {
    contentQualityScore: Math.max(50, Math.min(98, contentScore)),
    achievementImpactScore: Math.max(50, Math.min(98, impactScore)),
    readabilityScore: Math.max(50, Math.min(98, readabilityScore)),
    findings,
    analysisSource: "heuristic" as const
  };
}

// Fallback heuristic job match generator
function generateHeuristicJobMatch(cv: any, jobDescription: string) {
  const jdLower = jobDescription.toLowerCase();
  const cvSkills = Array.isArray(cv.skills) ? cv.skills : [];
  
  const COMMON_TERMS = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "HTML", "CSS",
    "Next.js", "Vue", "Angular", "Express", "PostgreSQL", "MongoDB", "AWS", "Docker",
    "Kubernetes", "Git", "REST API", "GraphQL", "Agile", "Scrum", "CI/CD", "Jira",
    "Figma", "Redux", "Tailwind CSS", "Linux", "Cloud", "Analytics", "Project Management"
  ];

  const matchingSkills: any[] = [];
  const missingSkills: any[] = [];
  const keywords: any[] = [];

  const foundInJd = COMMON_TERMS.filter(term => jdLower.includes(term.toLowerCase()));
  const candidateSkillsLower = new Set(cvSkills.map((s: string) => s.toLowerCase()));

  foundInJd.forEach(term => {
    const isMatched = candidateSkillsLower.has(term.toLowerCase());
    const freqInJd = (jdLower.match(new RegExp(term.toLowerCase(), "g")) || []).length;
    const freqInCV = isMatched ? 1 : 0;

    keywords.push({
      keyword: term,
      priority: freqInJd >= 2 ? "required" : "preferred",
      status: isMatched ? "present" : "missing",
      frequencyInJob: Math.max(1, freqInJd),
      frequencyInCV: freqInCV
    });

    if (isMatched) {
      matchingSkills.push({
        name: term,
        status: "matched",
        matchType: "exact",
        foundLocation: "Skills section"
      });
    } else {
      missingSkills.push({
        name: term,
        status: "missing",
        matchType: "none",
        category: "Technical Skills"
      });
    }
  });

  const totalTerms = foundInJd.length || 1;
  const matchRatio = matchingSkills.length / totalTerms;
  const skillsScore = Math.min(95, Math.max(40, Math.round(matchRatio * 100)));
  const expScore = cv.experience && cv.experience.length > 0 ? 75 : 45;
  const kwScore = Math.min(95, Math.max(35, Math.round(matchRatio * 90 + 10)));
  const roleScore = 70;
  const eduScore = cv.education && cv.education.length > 0 ? 80 : 50;

  const overallScore = Math.round(
    skillsScore * 0.30 +
    expScore * 0.25 +
    kwScore * 0.20 +
    roleScore * 0.15 +
    eduScore * 0.10
  );

  let matchRating = "Moderate Match";
  if (overallScore >= 80) matchRating = "Strong Match";
  else if (overallScore >= 60) matchRating = "Moderate Match";
  else matchRating = "Low Match";

  return {
    overallScore,
    matchRating,
    categoryScores: {
      skillsMatch: skillsScore,
      experienceAlignment: expScore,
      keywordCoverage: kwScore,
      roleRelevance: roleScore,
      educationAlignment: eduScore
    },
    matchingSkills,
    missingSkills,
    keywords,
    strengths: matchingSkills.slice(0, 3).map(m => ({
      title: `${m.name} Competency`,
      description: `Target vacancy seeks ${m.name}, which is explicitly featured in your resume.`,
      evidence: `Demonstrated in your CV skills: "${m.name}".`
    })),
    gaps: missingSkills.slice(0, 4).map(m => ({
      jobRequirement: `${m.name} proficiency`,
      cvStatus: "Not mentioned in CV",
      recommendation: `If you have genuine experience with ${m.name}, highlight it in your experience or skills. If not, do not fabricate it.`,
      severity: "medium"
    })),
    contentImprovements: [],
    analyzedAt: new Date().toISOString(),
    analysisSource: "heuristic" as const
  };
}

// Fallback heuristic parser for CV Import if AI services are unavailable
function ruleBasedParseResume(rawText: string) {
  const lines = (rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const emailMatch = (rawText || "").match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : "";

  const phoneMatch = (rawText || "").match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  const linkedinMatch = (rawText || "").match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0] : "";

  const githubMatch = (rawText || "").match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  const github = githubMatch ? githubMatch[0] : "";

  let fullName = "Candidate";
  if (lines.length > 0) {
    const candidateLine = lines[0].replace(/resume|curriculum vitae|cv/gi, "").trim();
    if (candidateLine && candidateLine.length < 50 && !candidateLine.includes("@") && !candidateLine.includes("http")) {
      fullName = candidateLine;
    }
  }

  let jobTitle = "Professional";
  if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes("@") && !lines[1].includes("http")) {
    jobTitle = lines[1];
  }

  const commonKeywords = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "SQL",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Git", "Agile", "Leadership", "Management",
    "Communication", "Problem Solving"
  ];
  const detectedSkills = commonKeywords.filter(kw =>
    new RegExp(`\\b${kw}\\b`, "i").test(rawText || "")
  );

  const generateId = () => Math.random().toString(36).substring(2, 11);

  return {
    personal: {
      fullName,
      jobTitle,
      email,
      phone,
      location: "",
      linkedin,
      github,
      website: ""
    },
    summary: lines.slice(2, 6).join(" ").substring(0, 350) || "Experienced professional with proven track record of delivering high-quality results and collaborating across multidisciplinary teams.",
    experience: [
      {
        id: generateId(),
        company: "Professional Experience",
        position: jobTitle,
        location: "",
        startDate: "2021",
        endDate: "Present",
        current: true,
        description: lines.slice(3, 10).map(l => `- ${l}`).join("\n") || "- Executed key project milestones and responsibilities ensuring high standards of quality."
      }
    ],
    education: [
      {
        id: generateId(),
        school: "University / Institution",
        degree: "Bachelor's Degree",
        field: "Relevant Field of Study",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        notes: ""
      }
    ],
    skills: detectedSkills.length > 0 ? detectedSkills : ["Project Management", "Team Collaboration", "Problem Solving"],
    projects: [],
    certifications: [],
    languages: []
  };
}

// Fallback heuristic for legacy ATS endpoint
function generateHeuristicLegacyATS(cvData: any) {
  const audit = generateHeuristicATSAudit(cvData);
  return {
    score: audit.contentQualityScore,
    rating: audit.contentQualityScore >= 80 ? "Strong Match" : audit.contentQualityScore >= 60 ? "Moderate Match" : "Needs Optimization",
    summary: "Evaluation calculated based on deterministic ATS compliance rules including action verbs, section completeness, and readability.",
    metrics: {
      skillsAlignment: audit.contentQualityScore,
      readabilityFormatting: audit.readabilityScore,
      impactQuantification: audit.achievementImpactScore
    },
    skillsMatch: {
      matched: cvData?.skills && Array.isArray(cvData.skills) ? cvData.skills.slice(0, 6) : [],
      missing: ["Strategic Alignment", "Metrics Quantification"]
    },
    actionableSteps: audit.findings.slice(0, 4).map(f => ({
      section: f.section,
      finding: f.what,
      recommendation: f.how,
      impact: f.severity === "critical" ? "High" : f.severity === "important" ? "Medium" : "Low"
    })),
    analysisSource: "heuristic" as const
  };
}

// API Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Polish Bullet Points / Job Description
app.post("/api/cv/polish", async (req, res) => {
  try {
    const { text, jobTitle, company, position } = req.body;
    if (!text) {
      res.status(400).json({ error: "No description text provided to polish." });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are an expert executive resume writer and career coach.
Your job is to rewrite the raw work experience bullet points or text into professional, high-impact, results-oriented, active bullet points.

Guidelines:
- Start each bullet point with a strong action verb (e.g., " Spearheaded", "Architected", "Optimized", "Designed").
- Quantify achievements or mention business outcomes where plausible (even as placeholders if not provided, e.g., "improving performance by 15%").
- Keep them professional, concise, and focused on accomplishments rather than just list of tasks.
- Return the polished output ONLY as a bulleted list (using standard dash '-' characters) with 2 to 4 bullet points. Do not include introductory notes, conversational filler, or wrap with extra code blocks.

Job Details:
- Role & Position: ${position || "Professional"}
- Company: ${company || "Company"}
- Core Target/Context: ${jobTitle || ""}

Raw Text:
"${text}"`;

      const { response, analysisSource } = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      const polishedText = response?.text || "";
      if (polishedText.trim()) {
        res.status(200).json({ polishedText: polishedText.trim(), analysisSource });
        return;
      }
    } catch (aiErr) {
      console.warn("Gemini polish unavailable, using rule-based bullet polisher:", aiErr);
    }

    // Fallback if AI unavailable
    const fallbackText = ruleBasedPolishText(text);
    res.status(200).json({ polishedText: fallbackText, analysisSource: "heuristic" });
  } catch (error: any) {
    console.error("Error in /api/cv/polish:", error);
    res.status(200).json({ polishedText: ruleBasedPolishText(req.body?.text || ""), analysisSource: "heuristic" });
  }
});

// 2. Generate Professional Summary
app.post("/api/cv/summary", async (req, res) => {
  try {
    const { jobTitle, skills, experiences } = req.body;
    if (!jobTitle) {
      res.status(400).json({ error: "Target job title is required to generate a tailored summary." });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are a certified professional resume writer. Write a compelling, high-level Professional Summary (sometimes called a resume profile or summary of qualifications) for someone targeting a "${jobTitle}" role.

Details to incorporate if present:
- Skills: ${skills && Array.isArray(skills) ? skills.join(", ") : "relevant skills"}
- Key Experience keywords or highlights: ${experiences && Array.isArray(experiences) ? experiences.join("; ") : "industry experience"}

Guidelines:
- The summary must be exactly 3 to 4 short, highly professional sentences.
- Use active voice, crisp wording, and industry-standard executive terminology.
- Make it represent a highly motivated, skilled, and effective professional.
- Do NOT use pronouns like "I", "me", "my" (keep it in third-person professional style, e.g., "Result-oriented software engineer with 5+ years of experience...").
- Return ONLY the summary text block. Do not include headings, notes, introductory statements, or chat filler.`;

      const { response, analysisSource } = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      const summary = response?.text || "";
      if (summary.trim()) {
        res.status(200).json({ summary: summary.trim(), analysisSource });
        return;
      }
    } catch (aiErr) {
      console.warn("Gemini summary unavailable, using rule-based summary generator:", aiErr);
    }

    // Fallback if AI is unavailable
    const fallbackSummary = ruleBasedSummary(jobTitle, skills);
    res.status(200).json({ summary: fallbackSummary, analysisSource: "heuristic" });
  } catch (error: any) {
    console.error("Error in /api/cv/summary:", error);
    res.status(200).json({ summary: ruleBasedSummary(req.body?.jobTitle || "Professional", req.body?.skills || []), analysisSource: "heuristic" });
  }
});

// 3. Recommended Skills and Credentials by Job Title
app.post("/api/cv/suggest-skills", async (req, res) => {
  const fallbackSkills = [
    "Project Management",
    "Team Collaboration",
    "Problem Solving",
    "Analytical Thinking",
    "Strategic Planning",
    "Process Optimization"
  ];
  const fallbackCerts = [
    "Project Management Professional (PMP)",
    "Certified ScrumMaster (CSM)",
    "AWS Certified Cloud Practitioner"
  ];

  try {
    const { jobTitle } = req.body;
    if (!jobTitle) {
      res.status(400).json({ error: "Job title is required." });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Provide 10-12 highly relevant and popular tech skills, soft skills, or tools for a professional seeking a "${jobTitle}" role, as well as 3 popular industry certifications.
Format the output as a clean JSON objects list.`;

      const { response, analysisSource } = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 10-12 professional skills and technologies relevant to this job title."
              },
              certifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3 useful certifications/credentials for this job."
              }
            },
            required: ["skills", "certifications"]
          }
        }
      });

      let resultText = response?.text || "{}";
      if (resultText.includes("```")) {
        resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
      }
      resultText = resultText.trim();

      const data = JSON.parse(resultText);
      if (data.skills && Array.isArray(data.skills)) {
        res.status(200).json({ ...data, analysisSource });
        return;
      }
    } catch (aiErr) {
      console.warn("Gemini suggest-skills notice, returning safe recommendation list:", aiErr);
    }

    res.status(200).json({
      skills: fallbackSkills,
      certifications: fallbackCerts,
      analysisSource: "heuristic"
    });
  } catch (error: any) {
    console.error("Error in /api/cv/suggest-skills:", error);
    res.status(200).json({
      skills: fallbackSkills,
      certifications: fallbackCerts,
      analysisSource: "heuristic"
    });
  }
});

// 4. Import & Parse Existing Resume Text or File with Gemini
app.post("/api/cv/import", async (req, res) => {
  try {
    const { text, fileData } = req.body;
    if (!text && !fileData) {
      res.status(400).json({ error: "Please provide resume text or file data to parse." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Analyze the provided raw, unstructured resume/CV document and parse it into a highly structured JSON object matching the resume schema.
If certain fields or sections are missing or not explicitly stated, populate them with clean defaults (empty strings or empty arrays) but DO NOT omit the keys.
Be diligent in extracting:
- Personal Details: Full Name, Job Title, Contact details (email, phone, location, linkedin, github, website).
- Professional Summary.
- Work Experience: Company name, job position, location, start and end dates (or current), and a rich description of their key achievements.
- Education: School, degree, field of study, location, start/end dates, notes.
- Skills: List of key tech skills, programming languages, and core competencies.
- Projects: Project name, technologies used, description, and link if available.
- Certifications: Name, issuer, and date.
- Languages: Name and proficiency level.`;

    const parts: any[] = [];
    if (fileData && fileData.base64 && fileData.mimeType) {
      parts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType
        }
      });
      parts.push({
        text: `${prompt}\n\nPlease parse the content of this file.`
      });
    } else {
      parts.push({
        text: `${prompt}\n\nRaw CV Text:\n"""\n${text}\n"""`
      });
    }

    let safeResult: any = null;
    try {
      safeResult = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personal: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING },
                website: { type: Type.STRING }
              },
              required: ["fullName", "jobTitle", "email", "phone", "location", "linkedin", "github", "website"]
            },
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  position: { type: Type.STRING },
                  location: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  current: { type: Type.BOOLEAN },
                  description: { type: Type.STRING }
                },
                required: ["company", "position", "location", "startDate", "endDate", "current", "description"]
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  field: { type: Type.STRING },
                  location: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  current: { type: Type.BOOLEAN },
                  notes: { type: Type.STRING }
                },
                required: ["school", "degree", "field", "location", "startDate", "endDate", "current", "notes"]
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  technologies: { type: Type.STRING },
                  description: { type: Type.STRING },
                  link: { type: Type.STRING }
                },
                required: ["name", "technologies", "description", "link"]
              }
            },
            certifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  issuer: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["name", "issuer", "date"]
              }
            },
            languages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  proficiency: { type: Type.STRING }
                },
                required: ["name", "proficiency"]
              }
            }
          },
          required: ["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages"]
        }
      }
    });
    } catch (aiErr) {
      console.warn("Gemini import notice, using rule-based resume parser fallback:", aiErr);
      const fallbackParsed = ruleBasedParseResume(text || "");
      res.status(200).json({ cvData: fallbackParsed, analysisSource: "heuristic" });
      return;
    }

    const { response, analysisSource } = safeResult;
    let resultText = response?.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedData = JSON.parse(resultText);
      const generateId = () => Math.random().toString(36).substring(2, 11);

      // Backfill structural IDs for absolute React compatibility
      if (parsedData.experience && Array.isArray(parsedData.experience)) {
        parsedData.experience = parsedData.experience.map((item: any) => ({
          id: generateId(),
          company: item.company || "",
          position: item.position || "",
          location: item.location || "",
          startDate: item.startDate || "",
          endDate: item.endDate || "",
          current: !!item.current,
          description: item.description || ""
        }));
      }
      if (parsedData.education && Array.isArray(parsedData.education)) {
        parsedData.education = parsedData.education.map((item: any) => ({
          id: generateId(),
          school: item.school || "",
          degree: item.degree || "",
          field: item.field || "",
          location: item.location || "",
          startDate: item.startDate || "",
          endDate: item.endDate || "",
          current: !!item.current,
          notes: item.notes || ""
        }));
      }
      if (parsedData.projects && Array.isArray(parsedData.projects)) {
        parsedData.projects = parsedData.projects.map((item: any) => ({
          id: generateId(),
          name: item.name || "",
          technologies: item.technologies || "",
          description: item.description || "",
          link: item.link || ""
        }));
      }
      if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
        parsedData.certifications = parsedData.certifications.map((item: any) => ({
          id: generateId(),
          name: item.name || "",
          issuer: item.issuer || "",
          date: item.date || ""
        }));
      }
      if (parsedData.languages && Array.isArray(parsedData.languages)) {
        parsedData.languages = parsedData.languages.map((item: any) => ({
          id: generateId(),
          name: item.name || "",
          proficiency: item.proficiency || ""
        }));
      }

      res.status(200).json({ cvData: parsedData, analysisSource });
    } catch (parseError) {
      console.error("Failed to parse parsed CV JSON, using rule-based parser:", resultText, parseError);
      const fallbackParsed = ruleBasedParseResume(text || "");
      res.status(200).json({ cvData: fallbackParsed, analysisSource: "heuristic" });
    }
  } catch (error: any) {
    console.error("Error in /api/cv/import, using rule-based parser:", error);
    const fallbackParsed = ruleBasedParseResume(req.body?.text || "");
    res.status(200).json({ cvData: fallbackParsed, analysisSource: "heuristic" });
  }
});

// 5. Run Advanced ATS Score & Content Quality Audit with Gemini
app.post("/api/cv/ats-analyze", async (req, res) => {
  try {
    const { cvData } = req.body;
    if (!cvData) {
      res.status(400).json({ error: "CV data is required for ATS analysis." });
      return;
    }

    // Sanitize input to only include relevant CV fields (no user IDs or auth metadata)
    const sanitizedCV = {
      personal: {
        fullName: cvData.personal?.fullName || "",
        jobTitle: cvData.personal?.jobTitle || "",
        email: cvData.personal?.email || "",
        phone: cvData.personal?.phone || "",
        location: cvData.personal?.location || "",
        linkedin: cvData.personal?.linkedin || "",
        github: cvData.personal?.github || "",
        website: cvData.personal?.website || ""
      },
      summary: cvData.summary || "",
      experience: (cvData.experience || []).map((exp: any) => ({
        id: exp.id,
        company: exp.company || "",
        position: exp.position || "",
        location: exp.location || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        current: Boolean(exp.current),
        description: exp.description || ""
      })),
      education: (cvData.education || []).map((edu: any) => ({
        id: edu.id,
        school: edu.school || "",
        degree: edu.degree || "",
        field: edu.field || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        notes: edu.notes || ""
      })),
      skills: Array.isArray(cvData.skills) ? cvData.skills : [],
      projects: (cvData.projects || []).map((pr: any) => ({
        id: pr.id,
        name: pr.name || "",
        technologies: pr.technologies || "",
        description: pr.description || ""
      })),
      certifications: (cvData.certifications || []).map((c: any) => ({
        id: c.id,
        name: c.name || "",
        issuer: c.issuer || "",
        date: c.date || ""
      })),
      languages: (cvData.languages || []).map((l: any) => ({
        id: l.id,
        name: l.name || "",
        proficiency: l.proficiency || ""
      }))
    };

    const ai = getGeminiClient();
    const prompt = `You are a certified ATS (Applicant Tracking System) parser and senior recruiter auditing a candidate's CV.
Evaluate the CV's content quality, achievement orientation, and readability against standard hiring standards for: "${sanitizedCV.personal.jobTitle || "Professional"}".

CRITICAL AI SAFETY & ANTI-HALLUCINATION RULES:
1. You must NEVER invent, assume, or fabricate any facts:
   - Do NOT invent metrics, numbers, percentages, or dollar amounts.
   - Do NOT invent skills, tools, programming languages, technologies, or certifications.
   - Do NOT invent companies, job titles, degrees, schools, or dates.
2. If metrics or evidence are missing, recommend in "how" that the user add their real metrics (e.g. "Add your actual team size, revenue increase, or latency reduction if available").
3. When providing "suggestedText", you must STRICTLY preserve the user's original facts. Only convert passive phrasing ("Responsible for managing") into strong active voice ("Managed and coordinated"), remove filler words, and strengthen professional flow.

Evaluate these specific areas:
- Professional summary quality (is it concise, 3rd person, focused on target role?)
- Experience bullet quality (action verbs, results orientation, clarity, avoiding passive phrases like "responsible for" or "duties included")
- Weak/generic wording and cliches (e.g., "hard worker", "team player", "handled daily tasks")
- Repetition and flow across bullet points
- Tone and readability

Candidate CV to Audit:
${JSON.stringify(sanitizedCV, null, 2)}

Provide scores from 0-100 for contentQuality, achievementImpact, and readability, plus an array of findings.
For each finding, provide:
- category: 'contentQuality' | 'achievementImpact' | 'readability'
- severity: 'critical' (severe flaw) | 'important' (notable improvement) | 'suggestion' (polish) | 'passed' (good element)
- section: readable string (e.g., 'Summary', 'Experience → Software Engineer', 'Skills')
- itemId: ID of the corresponding experience/project/education item if applicable
- bulletIndex: 0-indexed integer of the bullet line if targeting a specific bullet point
- what: Clear explanation of what is weak or missing
- why: Why it matters to ATS systems and recruiters
- how: Actionable advice for how the user can improve it
- originalText: The exact text from the resume if suggesting an improvement
- suggestedText: A safe, fact-preserving rewrite in active voice (only if originalText was provided)`;

    let safeResult: any = null;
    try {
      safeResult = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contentQualityScore: { type: Type.INTEGER, description: "Content quality and relevance score 0-100" },
              achievementImpactScore: { type: Type.INTEGER, description: "Achievement and outcome impact score 0-100" },
              readabilityScore: { type: Type.INTEGER, description: "Readability, tone, and brevity score 0-100" },
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, enum: ["contentQuality", "achievementImpact", "readability"] },
                    severity: { type: Type.STRING, enum: ["critical", "important", "suggestion", "passed"] },
                    section: { type: Type.STRING },
                    itemId: { type: Type.STRING },
                    bulletIndex: { type: Type.INTEGER },
                    what: { type: Type.STRING },
                    why: { type: Type.STRING },
                    how: { type: Type.STRING },
                    originalText: { type: Type.STRING },
                    suggestedText: { type: Type.STRING }
                  },
                  required: ["category", "severity", "section", "what", "why", "how"]
                }
              }
            },
            required: ["contentQualityScore", "achievementImpactScore", "readabilityScore", "findings"]
          }
        }
      });
    } catch (aiErr) {
      console.warn("Gemini ATS audit notice, falling back to deterministic analyzer:", aiErr);
      const fallbackAudit = generateHeuristicATSAudit(sanitizedCV);
      res.status(200).json(fallbackAudit);
      return;
    }

    const { response, analysisSource } = safeResult;
    let resultText = response?.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedAudit = JSON.parse(resultText);
      res.status(200).json({ ...parsedAudit, analysisSource });
    } catch (parseError) {
      console.error("Failed to parse ATS Audit JSON response, using deterministic fallback:", resultText, parseError);
      const fallbackAudit = generateHeuristicATSAudit(sanitizedCV);
      res.status(200).json(fallbackAudit);
    }
  } catch (error: any) {
    console.error("Error in /api/cv/ats-analyze:", error);
    const fallbackAudit = generateHeuristicATSAudit(req.body?.cvData || {});
    res.status(200).json(fallbackAudit);
  }
});

// 6. Run Semantic Job Description to CV Match with Gemini
app.post("/api/cv/job-match", async (req, res) => {
  try {
    const { cvData, jobDescription } = req.body;
    if (!cvData || typeof cvData !== "object") {
      res.status(400).json({ error: "Candidate CV data is required to perform Job Match analysis." });
      return;
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
      res.status(400).json({ error: "A valid job description (at least 20 characters) is required." });
      return;
    }

    // Sanitize input to only include relevant CV fields (no user IDs or auth metadata)
    const sanitizedCV = {
      personal: {
        fullName: cvData.personal?.fullName || "",
        jobTitle: cvData.personal?.jobTitle || "",
        location: cvData.personal?.location || ""
      },
      summary: cvData.summary || "",
      experience: (cvData.experience || []).map((exp: any) => ({
        id: exp.id || "",
        company: exp.company || "",
        position: exp.position || "",
        location: exp.location || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        current: Boolean(exp.current),
        description: exp.description || ""
      })),
      education: (cvData.education || []).map((edu: any) => ({
        id: edu.id || "",
        school: edu.school || "",
        degree: edu.degree || "",
        field: edu.field || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        notes: edu.notes || ""
      })),
      skills: Array.isArray(cvData.skills) ? cvData.skills : [],
      projects: (cvData.projects || []).map((pr: any) => ({
        id: pr.id || "",
        name: pr.name || "",
        technologies: pr.technologies || "",
        description: pr.description || ""
      })),
      certifications: (cvData.certifications || []).map((c: any) => ({
        id: c.id || "",
        name: c.name || "",
        issuer: c.issuer || ""
      })),
      languages: (cvData.languages || []).map((l: any) => ({
        id: l.id || "",
        name: l.name || "",
        proficiency: l.proficiency || ""
      }))
    };

    const ai = getGeminiClient();
    const prompt = `You are a principal technical recruiter and talent matching expert performing a real, rigorous comparison between a candidate's CV and a target Job Description.

STRICT ANTI-HALLUCINATION & INTEGRITY RULES:
1. NEVER invent, assume, or fabricate candidate information:
   - Do NOT invent metrics, numbers, percentages, or achievements.
   - Do NOT invent skills, tools, languages, frameworks, or certifications not in the CV.
   - Do NOT invent companies, job titles, degrees, or years of experience.
2. If the Job requires a skill, tool, framework, or qualification absent from the CV, you MUST classify it as "missing" (status: "missing", matchType: "none"). Label it clearly as "Missing from CV". Do NOT automatically add it.
3. In gap recommendations, ALWAYS provide authentic guidance: "If you have genuine experience with [Skill/Tool], highlight it in [Relevant Section]. If you do not have this experience, do not fabricate it."
4. In "contentImprovements", ONLY suggest rewrites for sentences/bullets ALREADY present in the CV to better align with the job description's terminology while preserving 100% of the candidate's authentic facts.
5. Provide realistic, non-inflated category scores (0-100) based on genuine evidence.

Target Job Description:
"""
${jobDescription.trim()}
"""

Candidate CV:
${JSON.stringify(sanitizedCV, null, 2)}

Perform the following:
1. Extract the target job title from the job description.
2. Extract the company name (if mentioned in the vacancy).
3. Identify all skills and tools required or preferred by the job. Partition them into:
   - matchingSkills: Skills present in the CV that satisfy JD requirements (state the foundLocation in the CV).
   - missingSkills: Skills/tools required or preferred by the job that are absent from the CV.
4. Extract key keywords/technologies with their priority ("required" | "preferred" | "general"), status ("present" | "missing"), frequencyInJob, and frequencyInCV.
5. Identify 2-4 key alignment strengths with direct evidence quotes from the CV.
6. Identify requirement gaps with:
   - jobRequirement: what the job specifically asks for
   - cvStatus: what the CV currently shows (e.g. "Not mentioned in CV" or "Candidate has X years vs Y years required")
   - recommendation: safe, authentic advice on how to address it if the candidate possesses this experience
   - severity: "high" | "medium" | "low"
7. Identify 1-3 targeted content improvements (rewrites of existing CV bullets or summary only) to improve keyword alignment while preserving candidate facts.
8. Evaluate category scores (0-100):
   - skillsMatchScore (Weight 30%): based on matched skills / total required skills
   - experienceAlignmentScore (Weight 25%): based on required years vs candidate years and domain fit
   - keywordCoverageScore (Weight 20%): based on presence of essential job keywords
   - roleRelevanceScore (Weight 15%): based on job title and career trajectory match
   - educationAlignmentScore (Weight 10%): based on degree, field, or certification requirements`;

    let safeResult: any = null;
    try {
      safeResult = await generateContentSafe(ai, {
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedJobTitle: { type: Type.STRING, description: "Job title extracted from the Job Description" },
            detectedCompany: { type: Type.STRING, description: "Company name extracted from the Job Description if present" },
            skillsMatchScore: { type: Type.INTEGER, description: "0-100 skills match score" },
            experienceAlignmentScore: { type: Type.INTEGER, description: "0-100 experience alignment score" },
            keywordCoverageScore: { type: Type.INTEGER, description: "0-100 keyword coverage score" },
            roleRelevanceScore: { type: Type.INTEGER, description: "0-100 role relevance score" },
            educationAlignmentScore: { type: Type.INTEGER, description: "0-100 education alignment score" },
            matchingSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["matched", "partial"] },
                  matchType: { type: Type.STRING, enum: ["exact", "semantic"] },
                  foundLocation: { type: Type.STRING, description: "Where in CV this skill is evidenced" }
                },
                required: ["name", "status"]
              }
            },
            missingSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["missing"] },
                  matchType: { type: Type.STRING, enum: ["none"] },
                  category: { type: Type.STRING }
                },
                required: ["name", "status"]
              }
            },
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["required", "preferred", "general"] },
                  status: { type: Type.STRING, enum: ["present", "missing"] },
                  frequencyInJob: { type: Type.INTEGER },
                  frequencyInCV: { type: Type.INTEGER }
                },
                required: ["keyword", "priority", "status", "frequencyInJob", "frequencyInCV"]
              }
            },
            strengths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  evidence: { type: Type.STRING }
                },
                required: ["title", "description", "evidence"]
              }
            },
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobRequirement: { type: Type.STRING },
                  cvStatus: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["jobRequirement", "cvStatus", "recommendation", "severity"]
              }
            },
            contentImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  itemId: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  suggestedText: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["section", "originalText", "suggestedText", "explanation"]
              }
            }
          },
          required: [
            "skillsMatchScore",
            "experienceAlignmentScore",
            "keywordCoverageScore",
            "roleRelevanceScore",
            "educationAlignmentScore",
            "matchingSkills",
            "missingSkills",
            "strengths",
            "gaps"
          ]
        }
      }
    });
    } catch (aiErr) {
      console.warn("Gemini job match notice, falling back to deterministic analyzer:", aiErr);
      const fallbackResult = generateHeuristicJobMatch(sanitizedCV, jobDescription);
      res.status(200).json(fallbackResult);
      return;
    }

    const { response, analysisSource } = safeResult;
    let resultText = response?.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedMatch = JSON.parse(resultText);

      // Clamp category scores strictly between 0 and 100
      const skillsScore = Math.min(100, Math.max(0, Math.round(Number(parsedMatch.skillsMatchScore) || 0)));
      const expScore = Math.min(100, Math.max(0, Math.round(Number(parsedMatch.experienceAlignmentScore) || 0)));
      const kwScore = Math.min(100, Math.max(0, Math.round(Number(parsedMatch.keywordCoverageScore) || 0)));
      const roleScore = Math.min(100, Math.max(0, Math.round(Number(parsedMatch.roleRelevanceScore) || 0)));
      const eduScore = Math.min(100, Math.max(0, Math.round(Number(parsedMatch.educationAlignmentScore) || 0)));

      // Compute overall score with weighted formula:
      // Skills: 30%, Experience: 25%, Keywords: 20%, Role: 15%, Education: 10%
      const overallScore = Math.min(100, Math.max(0, Math.round(
        skillsScore * 0.30 +
        expScore * 0.25 +
        kwScore * 0.20 +
        roleScore * 0.15 +
        eduScore * 0.10
      )));

      let matchRating = "Moderate Match";
      if (overallScore >= 85) {
        matchRating = "High Match";
      } else if (overallScore >= 70) {
        matchRating = "Strong Match";
      } else if (overallScore >= 50) {
        matchRating = "Moderate Match";
      } else {
        matchRating = "Low Match";
      }

      const formattedResult = {
        overallScore,
        matchRating,
        jobTitle: parsedMatch.detectedJobTitle || undefined,
        companyName: parsedMatch.detectedCompany || undefined,
        categoryScores: {
          skillsMatch: skillsScore,
          experienceAlignment: expScore,
          keywordCoverage: kwScore,
          roleRelevance: roleScore,
          educationAlignment: eduScore
        },
        matchingSkills: Array.isArray(parsedMatch.matchingSkills) ? parsedMatch.matchingSkills : [],
        missingSkills: Array.isArray(parsedMatch.missingSkills) ? parsedMatch.missingSkills : [],
        keywords: Array.isArray(parsedMatch.keywords) ? parsedMatch.keywords : [],
        strengths: Array.isArray(parsedMatch.strengths) ? parsedMatch.strengths : [],
        gaps: Array.isArray(parsedMatch.gaps) ? parsedMatch.gaps : [],
        contentImprovements: Array.isArray(parsedMatch.contentImprovements) ? parsedMatch.contentImprovements : [],
        analyzedAt: new Date().toISOString(),
        analysisSource
      };

      res.status(200).json(formattedResult);
    } catch (parseError) {
      console.error("Failed to parse Job Match JSON response, using deterministic fallback:", resultText, parseError);
      const fallbackResult = generateHeuristicJobMatch(sanitizedCV, jobDescription);
      res.status(200).json(fallbackResult);
    }
  } catch (error: any) {
    console.error("Error in /api/cv/job-match notice, using deterministic engine:", error);
    const fallbackResult = generateHeuristicJobMatch(req.body?.cvData || {}, req.body?.jobDescription || "");
    res.status(200).json(fallbackResult);
  }
});

// Legacy ATS endpoint proxy for backwards compatibility

app.post("/api/cv/ats", async (req, res) => {
  try {
    const { cvData, jobDescription } = req.body;
    if (!cvData) {
      res.status(400).json({ error: "CV data is required for ATS audit." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert ATS (Applicant Tracking System) recruiter and career optimization specialist.
Analyze the provided CV/resume against standard industry expectations for a "${cvData.personal?.jobTitle || "Professional"}" role.

Analyze the resume for:
1. Overall ATS compatibility score (0 to 100).
2. Readability, formatting, layout, action verbs usage, and impact quantification.
3. Matching keywords vs missing keywords.
4. Specific actionable optimization steps grouped by sections of the resume.

CV/Resume under analysis:
${JSON.stringify(cvData, null, 2)}

Return your analysis strictly in a clean JSON format matching the schema requested.`;

    let safeResult: any = null;
    try {
      safeResult = await generateContentSafe(ai, {
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Overall compatibility/match score out of 100" },
              rating: { type: Type.STRING, description: "Match description, e.g. 'Strong Match', 'Moderate Match', 'Needs Optimization'" },
              summary: { type: Type.STRING, description: "High-level summary of the analysis and readiness" },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  skillsAlignment: { type: Type.INTEGER, description: "Skills and keywords match score from 0-100" },
                  readabilityFormatting: { type: Type.INTEGER, description: "Readability, layout, and scanning score from 0-100" },
                  impactQuantification: { type: Type.INTEGER, description: "Impact, accomplishments, and metric quantification score from 0-100" }
                },
                required: ["skillsAlignment", "readabilityFormatting", "impactQuantification"]
              },
              skillsMatch: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of relevant keywords and skills found in the resume" },
                  missing: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important keywords and skills from the job/industry that are missing" }
                },
                required: ["matched", "missing"]
              },
              actionableSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    section: { type: Type.STRING, description: "The resume section, e.g., 'Summary', 'Experience', 'Skills', 'Projects'" },
                    finding: { type: Type.STRING, description: "What is currently lacking or could be improved" },
                    recommendation: { type: Type.STRING, description: "Exact actionable recommendation" },
                    impact: { type: Type.STRING, description: "Impact level of this change: 'High', 'Medium', or 'Low'" }
                  },
                  required: ["section", "finding", "recommendation", "impact"]
                },
                description: "Actionable concrete steps to optimize this CV"
              }
            },
            required: ["score", "rating", "summary", "metrics", "skillsMatch", "actionableSteps"]
          }
        }
      });
    } catch (aiErr) {
      console.warn("Gemini legacy ATS notice, using deterministic fallback:", aiErr);
      const fallbackAudit = generateHeuristicLegacyATS(cvData);
      res.status(200).json(fallbackAudit);
      return;
    }

    const { response, analysisSource } = safeResult;
    let resultText = response?.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedAudit = JSON.parse(resultText);
      res.status(200).json({ ...parsedAudit, analysisSource });
    } catch (parseError) {
      console.error("Failed to parse ATS Audit JSON response, using deterministic fallback:", resultText, parseError);
      const fallbackAudit = generateHeuristicLegacyATS(cvData);
      res.status(200).json(fallbackAudit);
    }
  } catch (error: any) {
    console.error("Error in /api/cv/ats, using deterministic fallback:", error);
    const fallbackAudit = generateHeuristicLegacyATS(req.body?.cvData || {});
    res.status(200).json(fallbackAudit);
  }
});

// Only bind server port and serve Vite middleware when NOT running in a Vercel Serverless Function
async function startLocalServer() {
  const PORT = 3000;

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Professional CV Builder Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer();
}

export default app;
