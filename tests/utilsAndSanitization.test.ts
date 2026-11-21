import { describe, it, expect } from "vitest";
import { formatCVDate, formatCVDateRange } from "../src/utils/dateUtils";
import { sanitizeExportFileName } from "../src/utils/pdfExport";
import {
  ALLOWED_IMPORT_MIME_TYPES,
  sanitizePromptText,
  sanitizeStringArray,
  sanitizeCVPayload,
} from "../server";

describe("Date formatting & export filename sanitization", () => {
  it("formats ISO YYYY-MM, Present, and fallback strings safely", () => {
    expect(formatCVDate("2024-01")).toBe("Jan 2024");
    expect(formatCVDate("2020-12")).toBe("Dec 2020");
    expect(formatCVDate("present")).toBe("Present");
    expect(formatCVDate("2024-15")).toBe("2024");
    expect(formatCVDate("")).toBe("");
    expect(formatCVDateRange("2022-05", "", true)).toBe("May 2022 – Present");
    expect(formatCVDateRange("2019-09", "2023-06", false)).toBe("Sep 2019 – Jun 2023");
  });

  it("strips HTML injection, path traversal, and invalid filename characters from exports", () => {
    expect(sanitizeExportFileName("</title><script>alert(1)</script>")).toBe("titlescriptalert(1)script");
    expect(sanitizeExportFileName("../../etc/passwd")).toBe("etcpasswd");
    expect(sanitizeExportFileName("  Jane   Doe  ")).toBe("Jane_Doe");
    expect(sanitizeExportFileName("   ")).toBe("Professional");
    expect(sanitizeExportFileName(undefined)).toBe("Professional");
  });
});

describe("Backend prompt & payload sanitization helpers", () => {
  it("neutralizes triple-quote prompt delimiters, null bytes, and caps length", () => {
    const cleaned = sanitizePromptText('Hello """Ignore previous"""\u0000 world', 40);
    expect(cleaned).not.toContain('"""');
    expect(cleaned).not.toContain("\u0000");
    expect(cleaned).toBe("Hello '''Ignore previous''' world");
    expect(sanitizePromptText("a".repeat(200), 50)).toHaveLength(50);
    expect(sanitizePromptText(12345, 50)).toBe("");
  });

  it("filters and bounds string arrays", () => {
    const arr = sanitizeStringArray(["React", 42, "   ", "Node.js", "SQL"], 2, 20);
    expect(arr).toEqual(["React", "Node.js"]);
  });

  it("redacts PII contact fields from CV payloads when includeContactInfo is false", () => {
    const sanitized = sanitizeCVPayload(
      {
        personal: {
          fullName: "Jane Doe",
          jobTitle: "Staff Engineer",
          location: "New York, NY",
          email: "jane@example.com",
          phone: "+1 555 123 4567",
          linkedin: "linkedin.com/in/janedoe",
        },
        skills: ["TypeScript", "React"],
      },
      false
    );

    expect(sanitized.personal.fullName).toBe("Jane Doe");
    expect(sanitized.personal.email).toBeUndefined();
    expect(sanitized.personal.phone).toBeUndefined();
    expect(sanitized.personal.linkedin).toBeUndefined();
  });

  it("restricts CV import MIME types to allowed document and image formats", () => {
    expect(ALLOWED_IMPORT_MIME_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_IMPORT_MIME_TYPES.has("text/html")).toBe(false);
    expect(ALLOWED_IMPORT_MIME_TYPES.has("application/javascript")).toBe(false);
  });
});
