# Contributing to ProCVMaker

Thank you for your interest in contributing to **ProCVMaker**. Contributions that improve accessibility, template print fidelity, deterministic ATS/Job Match accuracy, test coverage, and documentation are warmly welcomed.

## Development Workflow

1. Fork the repository and create a topic branch from `main` (e.g., `fix/ats-phone-validation` or `feat/a11y-modal-focus`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`. Setting `GEMINI_API_KEY` is optional for local development—all `/api/cv/*` endpoints degrade gracefully to deterministic rule-based heuristics when no key is configured.
4. Run the local server on port `3000`:
   ```bash
   npm run dev
   ```

## Quality & Verification Checks

Before opening a pull request, verify all automated checks pass locally:

```bash
npm run typecheck
npm test
npm run build
npm run seo:audit
```

## Coding & Architecture Guidelines

- **TypeScript & Modular Components**: Keep TypeScript types synchronized with `src/types.ts` and `firebase-blueprint.json` when changing data models.
- **Tailwind CSS v4**: Use Tailwind utility classes and theme tokens defined in `src/index.css` rather than introducing non-standard color steps or inline styles.
- **Zero-Hallucination & Privacy First**:
  - Never invent candidate skills, metrics, or employment claims in AI prompts or deterministic fallbacks.
  - Never log raw CV text, personal emails, phone numbers, API keys, or tokens to server stdout/stderr.
  - Never commit `.env` files, service account credentials, or personal resume snapshots.
- **Safety on Client Exports**: Never inject unescaped strings into `document.write()` or `innerHTML`; prefer DOM node APIs (`textContent`, `importNode`).

## Pull Request Expectations

- Keep PRs focused on a single concern with a clear problem statement and test coverage for logic or API changes.
- Preserve existing routes, SEO canonicals, and user data compatibility unless explicitly coordinated.
- Maintainer contact: `asadkhr39@gmail.com`.
