import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const strict = args.has("strict");
const liveBase = typeof args.get("live") === "string" ? args.get("live").replace(/\/$/, "") : null;
const outputDir = typeof args.get("dir") === "string" ? args.get("dir") : "dist";

const pages = [
  { path: "/", title: "Free AI CV Builder & ATS Resume Checker | ProCVMaker", canonical: "https://www.procvmaker.online/", index: true },
  { path: "/ats-checker", title: "Free ATS Resume Checker – Test & Improve Resume Score | ProCVMaker", canonical: "https://www.procvmaker.online/ats-checker", index: true },
  { path: "/job-match", title: "Resume Job Match – Compare CV to Job Description | ProCVMaker", canonical: "https://www.procvmaker.online/job-match", index: true },
  { path: "/builder", title: "CV Builder Workspace | ProCVMaker", canonical: "https://www.procvmaker.online/builder", index: false },
  { path: "/privacy", title: "Privacy Policy | ProCVMaker", canonical: "https://www.procvmaker.online/privacy", index: false },
  { path: "/terms", title: "Terms of Service | ProCVMaker", canonical: "https://www.procvmaker.online/terms", index: false }
];

const extract = (html, pattern) => html.match(pattern)?.[1]?.trim() ?? "";
const results = [];

for (const page of pages) {
  let html;
  let status = 200;
  if (liveBase) {
    const response = await fetch(`${liveBase}${page.path === "/" ? "/" : page.path}`, { redirect: "follow" });
    status = response.status;
    html = await response.text();
  } else {
    const file = page.path === "/" ? join(outputDir, "index.html") : join(outputDir, page.path.slice(1), "index.html");
    html = await readFile(file, "utf8");
  }

  const actual = {
    title: extract(html, /<title>([^<]*)<\/title>/i),
    description: extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i),
    canonical: extract(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["'][^>]*>/i),
    robots: extract(html, /<meta\s+name=["']robots["']\s+content=["']([^"']*)["'][^>]*>/i)
  };
  const errors = [];
  if (status !== 200) errors.push(`HTTP ${status}`);
  if (actual.title !== page.title) errors.push("incorrect title");
  if (actual.canonical !== page.canonical) errors.push("incorrect canonical");
  if (!actual.description) errors.push("missing description");
  if (page.index && /noindex/i.test(actual.robots)) errors.push("unexpected noindex");
  if (!page.index && !/noindex/i.test(actual.robots)) errors.push("missing noindex");
  results.push({ ...page, status, actual, errors });
}

const sitemapText = liveBase
  ? await (await fetch(`${liveBase}/sitemap.xml`)).text()
  : await readFile(join(outputDir, "sitemap.xml"), "utf8");
for (const page of pages.filter((item) => item.index)) {
  if (!sitemapText.includes(`<loc>${page.canonical}</loc>`)) {
    results.find((item) => item.path === page.path).errors.push("missing from sitemap");
  }
}
for (const page of pages.filter((item) => !item.index)) {
  if (sitemapText.includes(`<loc>${page.canonical}</loc>`)) {
    results.find((item) => item.path === page.path).errors.push("noindex URL present in sitemap");
  }
}

const failures = results.reduce((count, item) => count + item.errors.length, 0);
const report = [
  "# ProCVMaker SEO Agent Report",
  "",
  `Mode: ${liveBase ? `live (${liveBase})` : `build (${outputDir})`}`,
  `Result: ${failures ? `FAIL (${failures} issue${failures === 1 ? "" : "s"})` : "PASS"}`,
  "",
  "| Route | HTTP | Title | Canonical | Indexing | Result |",
  "|---|---:|---|---|---|---|",
  ...results.map((item) => `| ${item.path} | ${item.status} | ${item.actual.title === item.title ? "OK" : "FAIL"} | ${item.actual.canonical === item.canonical ? "OK" : "FAIL"} | ${item.index ? "index" : "noindex"} | ${item.errors.length ? item.errors.join("; ") : "PASS"} |`),
  "",
  `Generated: ${new Date().toISOString()}`,
  ""
].join("\n");

await writeFile("seo-report.md", report, "utf8");
console.log(report);
if (strict && failures) process.exitCode = 1;
