import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = "dist";
const baseHtml = await readFile(join(outputDir, "index.html"), "utf8");

const pages = {
  "ats-checker": {
    title: "Free ATS Resume Checker – Test & Improve Resume Score | ProCVMaker",
    description: "Check your resume for ATS compatibility, formatting, structure, keywords, and content quality with ProCVMaker's free ATS resume checker.",
    canonical: "https://www.procvmaker.online/ats-checker",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
  },
  "job-match": {
    title: "Resume Job Match – Compare CV to Job Description | ProCVMaker",
    description: "Compare your resume with a job description, identify matching skills and keyword gaps, and tailor your CV honestly with ProCVMaker.",
    canonical: "https://www.procvmaker.online/job-match",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
  },
  builder: {
    title: "CV Builder Workspace | ProCVMaker",
    description: "Build and export your ATS-friendly CV with ProCVMaker.",
    canonical: "https://www.procvmaker.online/builder",
    robots: "noindex,follow"
  },
  privacy: {
    title: "Privacy Policy | ProCVMaker",
    description: "Read the ProCVMaker privacy policy.",
    canonical: "https://www.procvmaker.online/privacy",
    robots: "noindex,follow"
  },
  terms: {
    title: "Terms of Service | ProCVMaker",
    description: "Read the ProCVMaker terms of service.",
    canonical: "https://www.procvmaker.online/terms",
    robots: "noindex,follow"
  }
};

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function upsertMeta(html, selector, tag) {
  const pattern = selector === "robots"
    ? /<meta\s+name=["']robots["'][^>]*>/i
    : new RegExp(`<meta\\s+property=["']${selector}["'][^>]*>`, "i");
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace("</head>", `    ${tag}\n  </head>`);
}

function render(page) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}" />`)
    .replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${page.canonical}" />`);

  html = upsertMeta(html, "robots", `<meta name="robots" content="${page.robots}" />`);
  html = upsertMeta(html, "og:title", `<meta property="og:title" content="${title}" />`);
  html = upsertMeta(html, "og:description", `<meta property="og:description" content="${description}" />`);
  html = upsertMeta(html, "og:url", `<meta property="og:url" content="${page.canonical}" />`);
  return html;
}

for (const [route, page] of Object.entries(pages)) {
  const routeDir = join(outputDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(join(routeDir, "index.html"), render(page), "utf8");
}

console.log(`Generated SEO HTML shells for ${Object.keys(pages).length} routes.`);
