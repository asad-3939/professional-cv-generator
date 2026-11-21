import { describe, it, expect } from "vitest";
import { runRuleBasedATSChecks, synthesizeATSAnalysis } from "../src/utils/atsEngine";
import type { CVData } from "../src/types";

function makeStrongCV(overrides: Partial<CVData> = {}): CVData {
  return {
    personal: {
      fullName: "Jordan Taylor",
      jobTitle: "Senior Software Engineer",
      email: "jordan.taylor@example.com",
      phone: "+1 555-234-5678",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/jordantaylor",
      github: "github.com/jordantaylor",
      website: "jordantaylor.dev",
    },
    summary:
      "Senior Software Engineer with 7 years of experience architecting scalable TypeScript, React, and cloud services for SaaS teams.",
    experience: [
      {
        id: "exp-1",
        company: "Northstar Systems",
        position: "Senior Software Engineer",
        location: "Austin, TX",
        startDate: "2022-01",
        endDate: "",
        current: true,
        description:
          "- Architected distributed Node.js APIs serving 1.2M daily requests while reducing p95 latency by 38%.\n- Mentored 5 engineers through quarterly architecture reviews and automated deployment pipelines.",
      },
      {
        id: "exp-2",
        company: "Summit Web Co",
        position: "Software Engineer",
        location: "Remote",
        startDate: "2019-03",
        endDate: "2021-12",
        current: false,
        description:
          "- Built accessible React dashboards in TypeScript and PostgreSQL supporting 40 enterprise teams.\n- Automated regression testing suites, cutting release defects by 45% across production sprints.",
      },
    ],
    education: [
      {
        id: "edu-1",
        school: "State University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        location: "Austin, TX",
        startDate: "2015-09",
        endDate: "2019-05",
        current: false,
        notes: "Graduated with honors in distributed systems and software engineering.",
      },
    ],
    skills: [
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "REST API",
      "CI/CD",
      "Cloud Architecture",
    ],
    projects: [
      {
        id: "proj-1",
        name: "Resume Parser Pipeline",
        technologies: "TypeScript, Node.js, Vitest",
        description: "Deterministic schema validator and rule-based document scorer for structured resume data.",
        link: "github.com/jordantaylor/resume-parser",
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        date: "2023-06",
      },
    ],
    languages: [{ id: "lang-1", name: "English", proficiency: "Native" }],
    ...overrides,
  };
}

describe("ATS Rule-Based Engine & Weighted Synthesizer", () => {
  it("scores a complete, well-structured CV highly with zero critical issues", () => {
    const cv = makeStrongCV();
    const { scores, issues } = runRuleBasedATSChecks(cv);

    expect(scores.contactInfo).toBe(100);
    expect(scores.structure).toBe(100);
    expect(scores.parseability).toBe(100);
    expect(issues.filter((i) => i.severity === "critical")).toHaveLength(0);
    expect(issues.some((i) => i.id === "contact_passed_full")).toBe(true);
    expect(issues.some((i) => i.id === "struct_experience_passed")).toBe(true);
  });

  it("flags missing contact info, empty sections, and duplicate skills deterministically", () => {
    const weakCV = makeStrongCV({
      personal: {
        fullName: "",
        jobTitle: "",
        email: "not-an-email",
        phone: "123",
        location: "",
        linkedin: "",
        github: "",
        website: "",
      },
      summary: "",
      experience: [],
      education: [],
      skills: ["React", "react", "TypeScript"],
      projects: [],
      certifications: [],
      languages: [],
    });

    const { scores, issues } = runRuleBasedATSChecks(weakCV);
    const ids = new Set(issues.map((i) => i.id));

    expect(ids.has("contact_name_missing")).toBe(true);
    expect(ids.has("contact_email_invalid")).toBe(true);
    expect(ids.has("contact_phone_short")).toBe(true);
    expect(ids.has("contact_location_missing")).toBe(true);
    expect(ids.has("struct_job_title_missing")).toBe(true);
    expect(ids.has("struct_summary_missing")).toBe(true);
    expect(ids.has("struct_experience_empty")).toBe(true);
    expect(ids.has("struct_education_empty")).toBe(true);
    expect(ids.has("struct_skills_few")).toBe(true);
    expect(ids.has("parse_duplicate_skills")).toBe(true);
    expect(ids.has("parse_content_sparse")).toBe(true);

    expect(scores.contactInfo).toBe(15);
    expect(scores.structure).toBe(10);
    expect(scores.parseability).toBe(65);
  });

  it("enforces exact 6-category weights (25/20/20/15/15/5) and boundary ratings", () => {
    const exceptional = synthesizeATSAnalysis(
      { parseability: 92, structure: 90, contactInfo: 100 },
      [],
      {
        contentQualityScore: 88,
        achievementImpactScore: 85,
        readabilityScore: 90,
        analysisSource: "gemini-3.8-flash",
      }
    );
    // 92*0.25 + 90*0.20 + 88*0.20 + 85*0.15 + 90*0.15 + 100*0.05 = 23 + 18 + 17.6 + 12.75 + 13.5 + 5 = 89.85 -> 90
    expect(exceptional.overallScore).toBe(90);
    expect(exceptional.rating).toBe("Exceptional");
    expect(exceptional.analysisSource).toBe("gemini-3.8-flash");

    const strong = synthesizeATSAnalysis(
      { parseability: 80, structure: 80, contactInfo: 80 },
      [],
      { contentQualityScore: 76, achievementImpactScore: 74, readabilityScore: 76 }
    );
    expect(strong.overallScore).toBeGreaterThanOrEqual(75);
    expect(strong.overallScore).toBeLessThan(88);
    expect(strong.rating).toBe("Strong ATS Match");

    const needsWork = synthesizeATSAnalysis(
      { parseability: 40, structure: 40, contactInfo: 40 },
      [],
      { contentQualityScore: 40, achievementImpactScore: 40, readabilityScore: 40 }
    );
    expect(needsWork.overallScore).toBe(40);
    expect(needsWork.rating).toBe("Needs Optimization");
  });

  it("clamps out-of-range AI scores to 0..100 and falls back gracefully when aiResponse is omitted", () => {
    const clamped = synthesizeATSAnalysis(
      { parseability: 100, structure: 100, contactInfo: 100 },
      [],
      {
        contentQualityScore: 999,
        achievementImpactScore: -50,
        readabilityScore: 105,
        findings: [
          {
            category: "achievementImpact",
            severity: "important",
            section: "Work Experience",
            what: "Missing metric",
            why: "Recruiters prefer measurable outcomes.",
            how: "Add percentage impact.",
          },
        ],
      }
    );

    expect(clamped.categoryScores.contentQuality).toBe(100);
    expect(clamped.categoryScores.achievementImpact).toBe(0);
    expect(clamped.categoryScores.readability).toBe(100);
    expect(clamped.importantImprovements).toHaveLength(1);

    const heuristicOnly = synthesizeATSAnalysis({ parseability: 80, structure: 80, contactInfo: 80 }, []);
    expect(heuristicOnly.analysisSource).toBe("heuristic");
    expect(heuristicOnly.categoryScores.contentQuality).toBe(75);
  });
});
