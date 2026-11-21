import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const STAGING_RULES_PATH = path.resolve("firestore.staging.rules");
const PROD_RULES_PATH = path.resolve("firestore.rules");
const STAGING_CONFIG_PATH = path.resolve("firebase.staging.json");
const BLUEPRINT_PATH = path.resolve("firebase-blueprint.json");

describe("Firestore Staging Security Rules & Configuration", () => {
  const stagingRules = fs.readFileSync(STAGING_RULES_PATH, "utf8");
  const prodRules = fs.readFileSync(PROD_RULES_PATH, "utf8");
  const stagingConfig = JSON.parse(fs.readFileSync(STAGING_CONFIG_PATH, "utf8"));
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8"));

  it("keeps staging configuration isolated from production firestore.rules", () => {
    expect(stagingConfig.firestore?.rules).toBe("firestore.staging.rules");
    expect(stagingConfig.emulators?.firestore?.port).toBe(8080);
    // Staging config must not invent or bind a production project ID
    expect(stagingConfig.projectId).toBeUndefined();
    // Staging rules remain distinct and hardened compared to untouched baseline rules
    expect(stagingRules).not.toEqual(prodRules);
  });

  it("enforces default deny catch-all and email_verified owner checks in staging rules", () => {
    expect(stagingRules).toContain("rules_version = '2';");
    expect(stagingRules).toMatch(/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
    expect(stagingRules).toContain("request.auth != null");
    expect(stagingRules).toContain("request.auth.uid == userId");
    expect(stagingRules).toContain("request.auth.token.email_verified == true");
  });

  it("enforces user profile allowlist, disables listing/deleting accounts, and supports client writes", () => {
    expect(stagingRules).toContain("allow get: if isOwner(userId);");
    expect(stagingRules).toContain("allow list: if false;");
    expect(stagingRules).toContain("allow delete: if false;");
    for (const field of [
      "'email'",
      "'displayName'",
      "'photoURL'",
      "'createdAt'",
      "'lastLoginAt'",
      "'activeCvId'",
      "'downloadsCount'",
      "'aiGenerations'",
    ]) {
      expect(stagingRules).toContain(field);
    }
    expect(stagingRules).toContain("data.downloadsCount >= 0");
    expect(stagingRules).toContain("data.aiGenerations.size() <= 200");
  });

  it("enforces CV schema allowlists, length caps, and immutable history snapshots", () => {
    expect(stagingRules).toContain("data.keys().hasAll(['title', 'data', 'design'])");
    expect(stagingRules).toContain("data.title.size() <= 200");
    expect(stagingRules).toContain("data.data.keys().size() <= 20");
    expect(stagingRules).toContain("data.design.keys().size() <= 25");
    expect(stagingRules).toContain("(!('createdAt' in oldData) || newData.createdAt == oldData.createdAt)");
    expect(stagingRules).toContain("allow update: if false;");
    expect(stagingRules).toContain("(data.format == 'pdf' || data.format == 'png')");
  });

  it("keeps firebase-blueprint.json synchronized with client profile & export history schemas", () => {
    const userProps = blueprint.entities?.User?.properties || {};
    expect(userProps).toHaveProperty("photoURL");
    expect(userProps).toHaveProperty("aiGenerations");
    expect(userProps).toHaveProperty("activeCvId");
    expect(userProps).toHaveProperty("downloadsCount");

    const historyRequired = blueprint.entities?.History?.required || [];
    expect(historyRequired).toEqual(
      expect.arrayContaining(["timestamp", "format", "fileName", "cvData", "designConfig"])
    );
  });
});
