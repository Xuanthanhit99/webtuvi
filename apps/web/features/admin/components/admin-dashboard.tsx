'use client';

import { AdminUserLookupPanel } from './admin-user-lookup-panel';
import { AdminNotificationHealthPanel } from './admin-notification-health-panel';
import { AdminAiSpendPanel } from './admin-ai-spend-panel';

/** Interim Sprint — Admin Operator Tooling. The smallest useful internal surface: search → result →
 * read-only operational metadata, per docs/architecture/admin-operator-tooling.md §7. Not a
 * dashboard product — no charts, no destructive controls, no role editor, no mutation of any kind.
 * Server-side authorization (AdminGuard, re-checked live on every request) is the only real
 * boundary; this page rendering at all already implies the visitor's session was confirmed ADMIN by
 * middleware.ts, but every API call underneath still carries its own independent check. */
export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-sm font-medium text-text-primary">Operator Tools</h1>
        <p className="text-body-sm text-text-secondary">Read-only lookups for support and operations. No account can be modified from here.</p>
      </div>
      <AdminUserLookupPanel />
      <AdminNotificationHealthPanel />
      <AdminAiSpendPanel />
    </div>
  );
}
