# Mệnh Vi — recovered SEO state (2026-09-24)

Starting branch: `audit/ui-seo-production-polish`; HEAD: `a60b2d01e10e2102eeb80183138e9513b0a3b7ec`.
Initial uncommitted state: only untracked `test-fail.txt`, preserved. No staged changes. Current source modifications were made in this same ongoing remediation, before the continuation specification arrived; no reset/revert/checkout was performed.

| Area | Recovered state | Previously fixed? | Still broken? | Action |
|---|---|---|---|---|
| Metadata helper / brand | PARTIAL | `lib/seo.ts`, shared brand, OG artwork already existed | localhost fallback; missing child OG locale; redundant Home brand | Extend existing helper only |
| Home SSR / H1 / links | FAIL on baseline raw HTTP | Existing approved Home UI has headings/links after auth | HTML contains skeleton until client auth | Render existing guest Home while auth resolves |
| Discovery public entry | PARTIAL | Four reusable marketing landings existed in HEAD; production returns 404 for them | Tool routes redirect to login; robots block; inherited noindex | Reuse existing landing component at unchanged `/discover/*` URLs; keep account data/API guards |
| Privacy | PASS on baseline | App/auth noindex and API ownership checks existed | Need preserve private reading query protection after public intro | Keep `?item=` login gate, noindex and no-store; no personal SSR |
| Sitemap | PARTIAL | HEAD already removed login/register | Fake modification date; public Discover absent; prod older sitemap includes auth | Stable list, omit unknown dates, use canonical public routes |
| Robots | PARTIAL | Derived private route list, assets allowed | Discover blocked; login block prevents crawler reading noindex | Separate public intros from private routes; preview switch |
| HTTPS | PASS (observed) | Railway edge HTTP -> HTTPS 301 | No verified code issue | Keep edge ownership; no app duplicate redirect |
| www | BLOCKED outside repo | No DNS resolution observed | Cannot reach host to redirect | Configure DNS/TLS + canonical redirect on host |
| JSON-LD | PARTIAL | WebSite, Organization, WebPage already exist | Relative WebPage URLs | Absolute URLs, no fabricated schema |
| Archived `/menh-vi/*` | FAIL against latest user requirement | Archived layout calls notFound | Recent HEAD middleware redirects bypass archived layout | Restore enforced 404 behavior by removing bypass only |
| Home artwork/layout | PASS/KEEP | AppShell, hero, responsive cards, optimized artwork | Dynamic date hydration risk after SSR fix | Preserve images/layout; stable date hydration and accurate sizes |
| Home trust/copy | FAIL | Existing Home UI present | Hardcoded percentages, almanac forecasts, non-existent article promises | Replace unsupported claims with truthful descriptions, keep layout |
| Brand in API-derived memory explanations | PARTIAL | UI/header/mail mostly already localized | Remaining returned BeaconVie English strings verified | Target text-only fixes with relevant tests |
| Favicon/manifest | PARTIAL | Existing Logo SVG; no app icon/manifest | Missing branded browser icon | Reuse existing symbol; optional minimal manifest, no fake install claims |
| Existing tests | PARTIAL | API 154 suites / 1669 tests passed | Natal/Discover stale English labels; early web run overlapped edits | Fix verified stale labels; rerun full suite after final source |
| Build | BLOCKED on first attempt | API build completed | Google Fonts EACCES in sandbox; stopped before successful web build | Retry with authorized network access, no fake success |
| Database integration | PARTIAL | Existing isolated `.env.test` points to beaconvie_test:5433 and Redis:6380 | Services initially stopped | Started repo compose without deleting data; use test DB only |
| Knowledge layer | NOT_APPLICABLE | No CMS/article backend | Outside this pass | Document future `/kien-thuc` only; do not implement |

Evidence: saved production headers/HTML and browser results in `work/production-audit/`; original reports read: `docs/progress/seo-shareability-foundation-final-report.md`, `docs/progress/domain-brand-production-lock-final-report.md`. Those are historical decisions, not proof of current production behavior.

Seobility 54% is user-reported, not independently reproduced. Its HTTP redirect concern is not reproduced for non-www HTTP (301 observed); H1/content/internal-link concerns are corroborated by raw Home HTML, which differs from hydrated DOM. No backlink work is in scope.
