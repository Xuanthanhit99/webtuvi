import { Divider } from '@/components/ui/divider';

/**
 * Google/Apple are shown per docs/reference Module 6 §4 (P0 at MVP), but disabled:
 * Sprint 1 has no OAuth provider credentials configured, and faking a successful
 * social login would violate the "no mock auth" requirement. Wiring these up is a
 * config-only change once credentials exist — see docs/architecture/sprint-1-decisions.md.
 */
export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Coming soon"
        className="flex h-11 items-center justify-center gap-2 rounded-md border border-border-subtle text-body-sm text-text-disabled opacity-60"
      >
        Continue with Google <span className="text-caption">(Coming soon)</span>
      </button>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Coming soon"
        className="flex h-11 items-center justify-center gap-2 rounded-md border border-border-subtle text-body-sm text-text-disabled opacity-60"
      >
        Continue with Apple <span className="text-caption">(Coming soon)</span>
      </button>
      <Divider label="or" />
    </div>
  );
}
