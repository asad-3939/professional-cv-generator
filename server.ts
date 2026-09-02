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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const polishedText = response.text || "";
    res.status(200).json({ polishedText: polishedText.trim() });
  } catch (error: any) {
    console.error("Error in /api/cv/polish:", error);
    res.status(500).json({ error: error.message || "Failed to polish text using Gemini." });
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const summary = response.text || "";
    res.status(200).json({ summary: summary.trim() });
  } catch (error: any) {
    console.error("Error in /api/cv/summary:", error);
    res.status(500).json({ error: error.message || "Failed to generate professional summary." });
  }
});

// 3. Recommended Skills and Credentials by Job Title
app.post("/api/cv/suggest-skills", async (req, res) => {
  try {
    const { jobTitle } = req.body;
    if (!jobTitle) {
      res.status(400).json({ error: "Job title is required." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Provide 10-12 highly relevant and popular tech skills, soft skills, or tools for a professional seeking a "${jobTitle}" role, as well as 3 popular industry certifications.
Format the output as a clean JSON objects list.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    let resultText = response.text || "{}";
    // Strip markdown code blocks if the model wrapped the JSON
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const data = JSON.parse(resultText);
      res.status(200).json(data);
    } catch (parseError) {
      console.error("Failed to parse Gemini response for suggestions. Raw response:", resultText, parseError);
      // Return a safe and clean fallback to resolve gracefully and never hang
      res.status(200).json({
        skills: [
          "Project Management",
          "Team Collaboration",
          "Problem Solving",
          "Analytical Thinking",
          "Strategic Planning",
          "Process Optimization"
        ],
        certifications: [
          "Project Management Professional (PMP)",
          "Certified ScrumMaster (CSM)",
          "AWS Certified Cloud Practitioner"
        ]
      });
    }
  } catch (error: any) {
    console.error("Error in /api/cv/suggest-skills:", error);
    res.status(500).json({ error: error.message || "Failed to suggest skills." });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

    let resultText = response.text || "{}";
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

      res.status(200).json({ cvData: parsedData });
    } catch (parseError) {
      console.error("Failed to parse parsed CV JSON:", resultText, parseError);
      res.status(500).json({ error: "Failed to assemble structured resume from Gemini output." });
    }
  } catch (error: any) {
    console.error("Error in /api/cv/import:", error);
    res.status(500).json({ error: error.message || "Failed to import resume." });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
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

    let resultText = response.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedAudit = JSON.parse(resultText);
      res.status(200).json(parsedAudit);
    } catch (parseError) {
      console.error("Failed to parse ATS Audit JSON response:", resultText, parseError);
      res.status(500).json({ error: "Failed to assemble structured ATS audit from AI output." });
    }
  } catch (error: any) {
    console.error("Error in /api/cv/ats-analyze:", error);
    res.status(500).json({ error: error.message || "Failed to run ATS analysis." });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
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

    let resultText = response.text || "{}";
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
    }
    resultText = resultText.trim();

    try {
      const parsedAudit = JSON.parse(resultText);
      res.status(200).json(parsedAudit);
    } catch (parseError) {
      console.error("Failed to parse ATS Audit JSON response:", resultText, parseError);
      res.status(500).json({ error: "Failed to assemble structured ATS audit from Gemini output." });
    }
  } catch (error: any) {
    console.error("Error in /api/cv/ats:", error);
    res.status(500).json({ error: error.message || "Failed to run ATS audit." });
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
