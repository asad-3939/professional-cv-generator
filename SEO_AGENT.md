# ProCVMaker SEO Agent

The SEO agent audits the HTML that search engines receive. It does not edit or deploy the website automatically.

## What it checks

- HTTP success for every public route
- Unique page titles and canonical URLs
- Meta descriptions
- `index`/`noindex` policy
- Sitemap inclusion for indexable pages
- Sitemap exclusion for private, workspace, and legal pages

## Approval-first workflow

1. A pull request that changes SEO-related files runs a build audit.
2. Every Monday at 08:15 Pakistan time, the agent audits the production website.
3. The report is stored in the GitHub Actions run as `seo-build-report` or `seo-live-report`.
4. A failed audit reports the issue but makes no code or production change.
5. Fixes are reviewed and merged through a pull request.

## Run locally

```bash
npm ci
npm run build
npm run seo:audit
```

To audit production:

```bash
npm run seo:audit:live
```

The report is written to `seo-report.md`.
