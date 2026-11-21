# Changelog

All notable changes to **ProCVMaker** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> Note: This workspace snapshot did not contain a local `.git` repository or prior commit tags, so historical versions prior to the pre-release open-source audit baseline are omitted rather than reconstructed.

## [Unreleased] - Open-Source & Security Readiness Hardening

### Security
- Refactored `exportVectorATSPDF` in `src/utils/pdfExport.ts` to replace raw HTML string interpolation in `document.write()` with static HTML shell initialization and DOM APIs (`createElement`, `textContent`, `importNode`), plus filename sanitization (`sanitizeExportFileName`) and executable node/attribute stripping (`stripExecutableNodes`).
- Removed dead, unauthenticated legacy `/api/auth/register` and `/api/auth/login` handlers, unused `firebase-admin` imports, and weak PBKDF2 helpers from `server.ts`.
- Added per-IP sliding-window rate limiting (`createRateLimiter` / `cvRateLimiter`) on `/api/cv/*` endpoints, strict MIME-type validation (`ALLOWED_IMPORT_MIME_TYPES`), input length/character sanitization (`sanitizePromptText`, `sanitizeCVPayload`), and `400` validation responses across AI routes.
- Added baseline HTTP hardening headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, disabled `x-powered-by`) and scrubbed CV/response payloads from error logs.
- Upgraded `express` (`^4.22.3`) and `vite` (`^6.4.6`), and removed unused `firebase-admin` and `html2canvas` dependencies.

### Fixed
- Defined missing Tailwind v4 `slate-750` and `slate-850` tokens in `src/index.css` `@theme` block.
- Fixed invalid inline CSS property `trackingWidth` -> `letterSpacing` and non-standard Tailwind shade classes in `src/components/ResumeTemplates.tsx`.
- Removed personal default names from the `localStorage` fallback reset check in `src/App.tsx`.
- Guarded `server.ts` HTTP listener startup when `VERCEL`, `NODE_ENV=test`, or `VITEST` is active so Express app exports cleanly for tests and serverless environments.

### Added
- Added Vitest unit and Express API integration test suite under `tests/` (`atsEngine.test.ts`, `jobMatchEngine.test.ts`, `utilsAndSanitization.test.ts`, `serverApi.test.ts`) and `vitest.config.ts`.
- Added open-source governance documentation (`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`) and `.github/` CI workflow plus issue/PR templates.
- Expanded `.env.example` and `.gitignore` for contributor safety.
