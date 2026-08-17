import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@beaconvie/types'],
  // Sprint 13 — produces `.next/standalone` (a self-contained server bundle with only the
  // dependencies it actually uses traced in, not the full node_modules tree), which is what
  // `apps/web/Dockerfile` copies into the runtime image. No effect on `next dev` or on anything
  // outside the container build. See docs/operations/production-deployment-runbook.md.
  output: 'standalone',
};

// Sprint 12 — wraps the build with Sentry's Next.js plugin (source map upload at build time,
// error-grouping metadata). `silent` avoids noisy build logs outside CI. Source map upload itself
// only actually runs when SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT are set (unset here — no
// such credential exists in this environment); its absence never breaks the build, per
// @sentry/nextjs's own documented behavior.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: false,
  telemetry: false,
});
