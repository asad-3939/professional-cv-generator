import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import app, { createRateLimiter, cvRateLimiter } from "../server";

let baseUrl = "";
let server: ReturnType<typeof app.listen>;

describe("Express API Validation, Security Headers, Fallbacks & Rate Limiting", () => {
  const previousApiKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    delete process.env.GEMINI_API_KEY;
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (previousApiKey !== undefined) {
      process.env.GEMINI_API_KEY = previousApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    cvRateLimiter.reset();
  });

  it("returns 200 OK and hardened headers on /api/health without exposing x-powered-by", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(res.headers.get("x-powered-by")).toBeNull();
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  });

  it("rejects malformed or missing inputs with 400 across CV endpoints", async () => {
    const polishRes = await fetch(`${baseUrl}/api/cv/polish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });
    expect(polishRes.status).toBe(400);

    const summaryRes = await fetch(`${baseUrl}/api/cv/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle: "" }),
    });
    expect(summaryRes.status).toBe(400);

    const importBadMime = await fetch(`${baseUrl}/api/cv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileData: { base64: "dGVzdA==", mimeType: "text/html" } }),
    });
    expect(importBadMime.status).toBe(400);

    const matchShortJd = await fetch(`${baseUrl}/api/cv/job-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData: { personal: {} }, jobDescription: "too short" }),
    });
    expect(matchShortJd.status).toBe(400);

    const atsInvalidBody = await fetch(`${baseUrl}/api/cv/ats-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData: "not-an-object" }),
    });
    expect(atsInvalidBody.status).toBe(400);
  });

  it("falls back cleanly to deterministic heuristic engines when GEMINI_API_KEY is unset", async () => {
    const polishRes = await fetch(`${baseUrl}/api/cv/polish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "responsible for building React dashboards",
        jobTitle: "Frontend Engineer",
      }),
    });
    const polishBody = await polishRes.json();
    expect(polishRes.status).toBe(200);
    expect(polishBody.analysisSource).toBe("heuristic");
    expect(polishBody.polishedText).toContain("-");

    const atsRes = await fetch(`${baseUrl}/api/cv/ats-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvData: {
          personal: { fullName: "Jordan Lee", jobTitle: "Backend Developer" },
          summary: "Experienced Node.js engineer delivering reliable APIs.",
          experience: [
            {
              id: "1",
              company: "Cloud Co",
              position: "Developer",
              description: "- Built APIs handling 10k req/min",
            },
          ],
          skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "Git"],
        },
      }),
    });
    const atsBody = await atsRes.json();
    expect(atsRes.status).toBe(200);
    expect(atsBody.analysisSource).toBe("heuristic");
    expect(typeof atsBody.contentQualityScore).toBe("number");

    const matchRes = await fetch(`${baseUrl}/api/cv/job-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvData: {
          personal: { fullName: "Jordan Lee", jobTitle: "Backend Developer" },
          skills: ["Node.js", "TypeScript", "PostgreSQL"],
          experience: [{ company: "Cloud Co", position: "Developer", description: "APIs" }],
          education: [{ school: "Uni", degree: "BS" }],
        },
        jobDescription:
          "Seeking a Backend Developer with strong Node.js, TypeScript, Docker, and Kubernetes skills.",
      }),
    });
    const matchBody = await matchRes.json();
    expect(matchRes.status).toBe(200);
    expect(matchBody.analysisSource).toBe("heuristic");
    expect(matchBody.missingSkills.some((m: any) => m.name === "Kubernetes")).toBe(true);
  });

  it("enforces rate limiting with 429 and Retry-After headers when threshold is exceeded", async () => {
    const testApp = express();
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    testApp.use("/limited", limiter, (_req, res) => res.json({ ok: true }));

    const testServer = await new Promise<ReturnType<typeof testApp.listen>>((resolve) => {
      const s = testApp.listen(0, "127.0.0.1", () => resolve(s));
    });

    try {
      const addr = testServer.address() as AddressInfo;
      const url = `http://127.0.0.1:${addr.port}/limited`;

      const r1 = await fetch(url);
      const r2 = await fetch(url);
      const r3 = await fetch(url);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(429);
      expect(r3.headers.get("retry-after")).toBeTruthy();
    } finally {
      await new Promise<void>((resolve) => testServer.close(() => resolve()));
    }
  });
});
