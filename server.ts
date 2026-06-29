import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseConfigPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Load local environment variables if present
dotenv.config();

// Create the global Express app instance
const app = express();

// Middleware
app.use(express.json());

// Initialize Firebase Admin safely
const dbId = firebaseConfig.firestoreDatabaseId || "(default)";

if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const db = getFirestore(dbId && dbId !== "(default)" ? dbId : undefined);

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
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const polishedText = response.text || "";
    res.json({ polishedText: polishedText.trim() });
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
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const summary = response.text || "";
    res.json({ summary: summary.trim() });
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
      model: "gemini-3.5-flash",
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

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/cv/suggest-skills:", error);
    res.status(500).json({ error: error.message || "Failed to suggest skills." });
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
