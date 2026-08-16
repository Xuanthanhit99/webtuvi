// Sprint 12 — Jest has no CSS transform (Next.js handles that at build time, not test time).
// global-error.tsx imports styles/globals.css directly (it bypasses app/layout.tsx entirely, see
// that file's own comment), so a bare `import '...css'` needs a no-op stub here or Jest fails to
// parse the raw `@tailwind` directives as JavaScript.
module.exports = {};
