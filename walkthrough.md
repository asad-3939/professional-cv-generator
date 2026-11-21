# Security Summary

We reviewed 22 core application, configuration, API, and build files across the **ProCVMaker** frontend, Express API backend, PDF/PNG export pipeline, Firebase client integration, and project dependencies. Four high-priority weaknesses in client print generation, dead authentication routes, unprotected AI proxy endpoints, and dependency hygiene were resolved, and an automated unit and API test suite was added to verify the fixes.

> **Pending Maintainer Approval**: `firestore.rules` hardening (strict field allowlists and size caps) and live telemetry/legal page updates (`index.html`, `PrivacyPolicy.tsx`, `TermsOfService.tsx`) remain documented as recommendations for maintainer approval before deployment.

---

## Issues Resolved

| Area | File | Issue | Fix Applied | Verification |
| --- | --- | --- | --- | --- |
| Client Print Export | `src/utils/pdfExport.ts` | HTML/script injection risk via raw `doc.write(...)` template literal interpolating `fileName` and `outerHTML` | Rebuilt `exportVectorATSPDF` using a static shell, `title.textContent`, `doc.importNode`, `stripExecutableNodes()`, and `sanitizeExportFileName()` | `tests/utilsAndSanitization.test.ts` + DOM API audit |
| Dead Backend Auth & Weak Hashing | `server.ts` | Unused unauthenticated `/api/auth/register` & `/api/auth/login` routes using 1000-iteration PBKDF2 and non-constant-time `===` hash checks, plus unused `firebase-admin` imports | Removed dead routes, weak crypto helpers, and unused Firebase Admin imports; removed `firebase-admin` package | Zero client callers confirmed; `tsc --noEmit` & API tests pass |
| AI Endpoint Validation & Abuse Controls | `server.ts` | Missing per-IP rate limiting, unbounded CV/prompt inputs, missing MIME allowlist on `/api/cv/import`, missing 400 checks, and PII/raw text in server logs | Added `createRateLimiter` (`429` + `Retry-After`), `ALLOWED_IMPORT_MIME_TYPES`, `sanitizePromptText`, `sanitizeCVPayload`, HTTP hardening headers, and clean fallback/error logging | `tests/serverApi.test.ts` |
| Direct Vulnerable Packages | `package.json` | Outdated `express@4.21.2`, `vite@6.2.3`, and unused `firebase-admin` / `html2canvas` | Upgraded `express@^4.22.3` and `vite@^6.4.6`; removed unused `firebase-admin` and `html2canvas`; synced lockfile | `npm ls` + `npm audit` |

---

## Safeguards Verified

- **Environment & Secret Separation**: `GEMINI_API_KEY` is read lazily on the server (`getGeminiClient()`), with zero `VITE_` client exposure and zero secrets printed to logs.
- **No Unhandled AI Outages**: All `/api/cv/*` endpoints validate inputs first (`400`) and fall back cleanly to deterministic heuristic engines (`analysisSource: "heuristic"`) when `GEMINI_API_KEY` is absent or upstream calls fail.
- **Rate Limiting & Payload Caps**: `/api/cv/*` enforces sliding-window IP throttling (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`), bounded tracking storage (`10,000` keys), and strict size caps across fields and uploaded base64 resumes.
- **HTTP Headers**: `x-powered-by` disabled; `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` enabled globally in `server.ts`.
- **Owner-Scoped Firebase Persistence**: Verified client reads/writes target `/users/{uid}/cvs` and `/users/{uid}/history` under `request.auth.uid == userId` rules (further schema/size tightening prepared in audit recommendations).

---

## PoC Verification

### PoC 1: Export Filename Breakout & Executable DOM Stripping (`src/utils/pdfExport.ts`)
- **Attack Scenario**: Passing a crafted CV fullName or title such as `"</title><script>alert(1)</script>"` or `"../../etc/passwd"` into `exportOptimizedPDF`, `exportHighResPNG`, or `exportVectorATSPDF` could previously break out of the `<title>` tag in `document.write()` or leave traversal tokens in filenames.
- **Verified Behavior**:
  1. `sanitizeExportFileName("</title><script>alert(1)</script>")` strips `<`, `>`, `/`, control chars, and traversal `..`, returning `"titlescriptalert(1)script"`; `sanitizeExportFileName("../../etc/passwd")` returns `"etcpasswd"`.
  2. `exportVectorATSPDF` initializes the print iframe via a constant document shell, sets the document title strictly via `titleEl.textContent`, copies stylesheet text into `<style>.textContent`, imports the preview node via `doc.importNode`, and strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `on*` event attributes, and `javascript:` links via `stripExecutableNodes()`.

### PoC 2: Malformed Inputs, Unsupported File Imports & Rate Limit Enforcement (`server.ts`)
- **Verified Execution (`tests/serverApi.test.ts` against ephemeral HTTP listener with `GEMINI_API_KEY` unset)**:
  - `POST /api/cv/polish` with `{ text: "   " }` -> `400 Bad Request`.
  - `POST /api/cv/import` with `{ fileData: { base64: "dGVzdA==", mimeType: "text/html" } }` -> `400 Bad Request`.
  - `POST /api/cv/job-match` with `{ cvData: { personal: {} }, jobDescription: "too short" }` -> `400 Bad Request`.
  - `POST /api/cv/ats-analyze` with `{ cvData: "not-an-object" }` -> `400 Bad Request`.
  - `GET /api/health` -> `200 OK`, `x-powered-by` absent (`null`), `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`.
  - Requests exceeding `createRateLimiter({ maxRequests: 2 })` -> `429 Too Many Requests` with `Retry-After` header.
  - Valid `/api/cv/polish`, `/api/cv/ats-analyze`, and `/api/cv/job-match` requests with no `GEMINI_API_KEY` -> `200 OK` returning `analysisSource: "heuristic"` deterministic outputs.

### PoC 3: Prompt Injection & PII Minimization (`server.ts`)
- **Verified Execution (`tests/utilsAndSanitization.test.ts`)**:
  - `sanitizePromptText('Hello """Ignore previous"""\u0000 world', 40)` replaces triple-quote delimiters (`"""` -> `'''`), strips null bytes, and caps length.
  - `sanitizeCVPayload(payload, false)` used on `/api/cv/ats-analyze` and `/api/cv/job-match` omits `email`, `phone`, `linkedin`, `github`, and `website` before serializing CV payloads into model prompts.
