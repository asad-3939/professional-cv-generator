# ProCVMaker

An ATS-friendly AI CV Builder, 6-category ATS Resume Checker, and Weighted Job Description Match Engine built with React, TypeScript, Tailwind CSS v4, Express, Firebase, and Google Gemini.

- **Live Website**: [https://www.procvmaker.online](https://www.procvmaker.online)
- **Repository**: [https://github.com/asad-3939/professional-cv-generator](https://github.com/asad-3939/professional-cv-generator)

---

## Key Capabilities

1. **Interactive CV Editor & Templates (`src/components/CVForm.tsx`, `src/components/ResumeTemplates.tsx`)**
   - Edit personal contact details, executive summary, work experience, education, skills, projects, certifications, and languages with instant preview.
   - Switch between 4 A4-proportioned templates (`Executive`, `Minimalist`, `Creative`, `Modern`), accent color palettes, font families (`sans`, `serif`, `mono`, `grotesk`), spacing scales, and section visibility toggles.
2. **Vector ATS PDF, Raster PDF & PNG Export (`src/utils/pdfExport.ts`)**
   - **Vector ATS PDF**: Uses browser native vector printing into an isolated offscreen iframe constructed safely with DOM APIs (`importNode`, `textContent`, executable tag/handler stripping).
   - **Optimized PDF & PNG**: Uses `html2canvas-pro` with Tailwind v4 `oklch`/`oklab` color conversion and `jsPDF` compression.
3. **Hybrid 6-Category ATS Resume Checker (`src/utils/atsEngine.ts`)**
   - Combines deterministic client-side hygiene checks (`Parseability` 25%, `Structure` 20%, `Contact Info` 5%) with backend AI/heuristic content audits (`Content Quality` 20%, `Achievement Impact` 15%, `Readability` 15%).
4. **Weighted 5-Category Job Description Match (`src/utils/jobMatchEngine.ts`)**
   - Evaluates `Skills Match` (30%), `Experience Alignment` (25%), `Keyword Coverage` (20%), `Role Relevance` (15%), and `Education Alignment` (10%).
   - Separates matched skills from missing skills with strict anti-hallucination guidance.
5. **AI Writing & Resume Import Endpoints with Deterministic Fallbacks (`server.ts`)**
   - `/api/cv/polish`, `/api/cv/summary`, `/api/cv/suggest-skills`, `/api/cv/import`, `/api/cv/ats-analyze`, `/api/cv/job-match`, and `/api/cv/ats` use Google Gemini (`gemini-3.8-flash` / `gemini-3.5-flash-lite`) with automatic retry on transient errors and deterministic heuristic fallbacks when `GEMINI_API_KEY` is unavailable.
   - Protected by per-IP rate limiting (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`), MIME-type allowlists, length caps, and payload sanitization.
6. **Optional Cloud Sync (`src/lib/firebase.ts`, `src/lib/cvService.ts`, `firestore.rules`)**
   - Works without an account via browser `localStorage` autosave.
   - Signed-in Google users can store multiple CVs and export history snapshots under owner-scoped Firestore collections (`/users/{userId}/cvs`, `/users/{userId}/history`).

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Express 4 (`server.ts`, Vercel entry `api/index.ts`), `@google/genai`
- **Persistence & Auth**: Firebase Authentication (Google Sign-In) & Cloud Firestore
- **Export & Tooling**: `jspdf`, `html2canvas-pro`, Vitest, static SEO page generator & strict SEO audit scripts (`scripts/`)

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Optional | — | Enables Google Gemini AI endpoints; falls back to deterministic heuristics if unset |
| `APP_URL` | Optional | `http://localhost:3000` | Base URL reference for local development |
| `NODE_ENV` | Optional | `development` | Switches Vite middleware vs `dist/` static serving |
| `RATE_LIMIT_WINDOW_MS` | Optional | `60000` | Sliding window duration in ms for `/api/cv/*` rate limiting |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | `30` | Maximum `/api/cv/*` requests per IP per window |
| `VITE_CLARITY_ID` | Optional | `""` | Optional Microsoft Clarity Project ID; telemetry stays blocked unless set AND the user clicks Accept |

> **Firebase Configuration**: Public web client configuration lives in `firebase-applet-config.json`. Review `firestore.staging.rules`, `STAGING_FIRESTORE_SETUP.md`, and `firebase-blueprint.json` before connecting your own Firebase staging or self-hosted project.

### 3. Run Development Server

```bash
npm run dev
```

The Express + Vite dev server listens on port `3000` (`http://localhost:3000`).

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start full-stack Express + Vite middleware server on port 3000 |
| `npm run typecheck` | Run TypeScript typechecking (`tsc --noEmit`) |
| `npm test` | Run Vitest unit and API integration tests |
| `npm run build` | Build frontend (`dist/`), generate static SEO landing pages, and bundle `dist/server.cjs` |
| `npm start` | Run compiled production server (`dist/server.cjs`) |
| `npm run seo:audit` | Validate canonical URLs, JSON-LD, meta tags, and sitemap outputs in `dist/` |

---

## Project Structure

```text
.
├── api/index.ts               # Vercel serverless entrypoint importing Express app
├── server.ts                  # Express API server, rate limiter, sanitizers, AI & heuristic engines
├── firestore.rules            # Baseline Firestore security rules
├── firestore.staging.rules    # Hardened staging-only Firestore security rules
├── firebase.staging.json      # Staging-only Firebase configuration (rules deployment target)
├── firebase-blueprint.json    # Firestore data model schema reference
├── scripts/                   # Static SEO page generator, strict SEO audit, & favicon generator
├── src/
│   ├── App.tsx                # Application shell, client router, autosave & workspace state
│   ├── types.ts               # Shared TypeScript interfaces for CV, ATS, and Job Match
│   ├── sampleData.ts          # Neutral default CV starter template
│   ├── components/            # Editor, templates, ATS & Job Match views, dashboard, legal pages
│   ├── lib/                   # Firebase SDK, Firestore helpers, & consent-gated Clarity manager
│   └── utils/                 # ATS rule engine, Job Match engine, date formatters, PDF/PNG exporters
└── tests/                     # Vitest unit, API, consent, and Firestore rules tests
```

---

## Security & Contributing

- Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) before opening pull requests.
- To report a security issue privately, see [`SECURITY.md`](SECURITY.md).

## License

ProCVMaker is licensed under the **MIT License** — see [`LICENSE`](LICENSE) for full terms (`Copyright (c) 2026 Asad Mustafa`).

Third-party open-source dependencies and fonts remain under their respective licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

