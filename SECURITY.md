# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues, pull requests, or discussions.

Instead, report security issues privately to the maintainer:

- **Email**: `asadkhr39@gmail.com` (Subject: `Security Report - ProCVMaker`)
- **GitHub**: Use private Security Advisories if enabled on the repository.

Please include:
1. A clear description of the vulnerability and affected files/endpoints.
2. Step-by-step reproduction instructions or a minimal proof of concept.
3. Potential impact (e.g., XSS, unauthorized Firestore access, API abuse, or secret exposure).

The maintainer reviews private reports on a best-effort basis and aims to acknowledge receipt promptly before coordinating a fix and disclosure timeline.

## Security Architecture Notes

- **Secrets**: `GEMINI_API_KEY` is strictly server-side (`server.ts`) and must never be exposed in client bundles or `VITE_*` variables.
- **Firebase Client Config**: Values in `firebase-applet-config.json` are Firebase Web SDK project identifiers, not private admin secrets. Access control is enforced by Cloud Firestore security rules (`firestore.rules`) scoped to authenticated `request.auth.uid`.
- **AI Endpoint Guardrails**: `/api/cv/*` endpoints enforce JSON/URL body limits (`10mb`), MIME-type allowlists on file imports, input length/character sanitization, prompt-delimiter escaping, and per-IP sliding-window rate limiting.
- **Client PDF Exports**: Vector print documents are constructed via safe DOM APIs (`importNode`, `textContent`) with inline event handlers and executable elements stripped.
