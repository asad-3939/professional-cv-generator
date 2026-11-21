import { describe, it, expect } from "vitest";
import {
  generateJobMatchKey,
  runDeterministicJobMatch,
  synthesizeJobMatchResult,
} from "../src/utils/jobMatchEngine";
import type { CVData } from "../src/types";

const baseCV: CVData = {
  personal: {
    fullName: "Alex Rivera",
    jobTitle: "Full Stack Engineer",
    email: "alex@example.com",
    phone: "+1 555-010-2000",
    location: "Seattle, WA",
    linkedin: "",
    github: "",
    website: "",
  },
  summary: "Full Stack Engineer building TypeScript, React, and PostgreSQL web applications.",
  experience: [
    {
      id: "exp-1",
      company: "Acme Labs",
      position: "Full Stack Engineer",
      location: "Seattle, WA",
      startDate: "2021-01",
      endDate: "",
      current: true,
      description: "Engineered REST API endpoints with Node.js and Express. Maintained Docker pipelines.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "Pacific University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Seattle, WA",
      startDate: "2016-09",
      endDate: "2020-05",
      current: false,
      notes: "",
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "C++"],
  projects: [],
  certifications: [],
  languages: [],
};

describe("Job Match Deterministic Engine & Anti-Hallucination Synthesizer", () => {
  it("generates stable cache keys sensitive to title and job description", () => {
    const k1 = generateJobMatchKey("Frontend Engineer", "React TypeScript");
    const k2 = generateJobMatchKey("Frontend Engineer", "React TypeScript  ");
    const k3 = generateJobMatchKey("Backend Engineer", "React TypeScript");

    expect(k1).toMatch(/^jm_\d+$/);
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
  });

  it("partitions matching and missing skills accurately without inventing unstated skills", () => {
    const jd = `
      Senior Full Stack Engineer
      Requirements:
      3+ years of experience with TypeScript, React, Node.js, PostgreSQL, C++, and Kubernetes.
      Preferred:
      GraphQL and Terraform experience is a plus.
    `;

    const result = runDeterministicJobMatch(baseCV, jd);
    const matchedNames = result.matchingSkills.map((s) => s.name);
    const missingNames = result.missingSkills.map((s) => s.name);

    expect(matchedNames).toContain("TypeScript");
    expect(matchedNames).toContain("React");
    expect(matchedNames).toContain("Node.js");
    expect(matchedNames).toContain("PostgreSQL");
    expect(missingNames).toContain("Kubernetes");
    expect(missingNames).toContain("GraphQL");
    expect(missingNames).toContain("Terraform");

    const k8sKeyword = result.keywords.find((k) => k.keyword === "Kubernetes");
    expect(k8sKeyword?.priority).toBe("required");
    expect(k8sKeyword?.status).toBe("missing");

    const gqlKeyword = result.keywords.find((k) => k.keyword === "GraphQL");
    expect(gqlKeyword?.priority).toBe("preferred");
  });

  it("synthesizes overall score using strict 30/25/20/15/10 weights and removes fabricated duplicates", () => {
    const rule = runDeterministicJobMatch(
      baseCV,
      "Requirements: TypeScript, React, and Kubernetes for scalable cloud software."
    );

    const synthesized = synthesizeJobMatchResult(rule, {
      skillsMatchScore: 80,
      experienceAlignmentScore: 90,
      keywordCoverageScore: 70,
      roleRelevanceScore: 85,
      educationAlignmentScore: 100,
      matchingSkills: [
        { name: "TypeScript", status: "matched", matchType: "exact", foundLocation: "Skills" },
      ],
      missingSkills: [
        // Even if model echoes TypeScript in missingSkills, synthesizer excludes already-matched skills
        { name: "TypeScript", status: "missing", matchType: "none" },
        { name: "Kubernetes", status: "missing", matchType: "none", category: "Cloud" },
      ],
      analysisSource: "gemini-3.5-flash-lite",
    });

    // 80*0.30 + 90*0.25 + 70*0.20 + 85*0.15 + 100*0.10 = 24 + 22.5 + 14 + 12.75 + 10 = 83.25 -> 83
    expect(synthesized.overallScore).toBe(83);
    expect(synthesized.matchRating).toBe("Strong Match");
    expect(synthesized.matchingSkills.map((s) => s.name)).toEqual(["TypeScript"]);
    expect(synthesized.missingSkills.map((s) => s.name)).toEqual(["Kubernetes"]);
    expect(synthesized.analysisSource).toBe("gemini-3.5-flash-lite");
  });

  it("produces authentic anti-hallucination gap recommendations when no AI response is present", () => {
    const rule = runDeterministicJobMatch(
      baseCV,
      "Requirements: Docker, Kubernetes, GraphQL, Python experience required."
    );
    const fallback = synthesizeJobMatchResult(rule);

    expect(fallback.analysisSource).toBe("heuristic");
    expect(fallback.gaps.length).toBeGreaterThan(0);
    expect(fallback.gaps[0].recommendation).toContain("do not fabricate");
  });
});
