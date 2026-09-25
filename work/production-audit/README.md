# Production audit evidence (SEO/UX remediation, Sept 2026)

- `recovered-baseline.md`, `resume-recovery.md` — Codex handoff notes for this remediation.
- `production_*.html` / `production_*.headers`, `production-www-http.txt`, `resume-production-about.html`,
  `production/*.png` — snapshots of https://tuvitarot.vn **before** this branch was deployed
  (old robots.txt blocking `/discover`, sitemap listing `/login`, `/discover/*` redirecting to login,
  `www` NXDOMAIN). Compare against production after deployment.
- `browser-audit.cjs`, `axe-production.cjs` — reusable crawl/axe scripts (`AUDIT_BASE_URL` selects the target).
- `start-api.cjs` — starts the built API against `apps/api/.env.test`; refuses any database other than
  `localhost/beaconvie_test` and forces the mock AI provider. Used for the authenticated Playwright specs.

Run logs (`*.log`) are gitignored and not kept here.
