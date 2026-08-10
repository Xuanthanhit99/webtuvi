const ROWS: { capability: string; free: string; premium: string }[] = [
  { capability: 'Daily Draw', free: '1 / day', premium: '1 / day' },
  { capability: 'Single Card', free: '3 / day', premium: '15 / day' },
  { capability: 'Three Card Spread', free: '1 / day', premium: '10 / day' },
  { capability: 'Interpretation', free: 'Basic', premium: 'Deeper, memory-personalized' },
  { capability: 'Reading history', free: 'Most recent 20', premium: 'Unlimited' },
];

/** The exact Free vs Premium matrix from docs/architecture/premium-entitlements.md, rendered
 * plainly — Three Card Spread stays available to Free (Phase 8: never silently remove
 * already-working free functionality), Premium just raises the ceiling. */
export function PremiumMatrix() {
  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full min-w-[420px] text-body-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface text-left text-text-secondary">
            <th className="px-3 py-2 font-medium">Capability</th>
            <th className="px-3 py-2 font-medium">Free</th>
            <th className="px-3 py-2 font-medium">Premium</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.capability} className="border-b border-border-subtle last:border-0">
              <td className="px-3 py-2 text-text-primary">{row.capability}</td>
              <td className="px-3 py-2 text-text-secondary">{row.free}</td>
              <td className="px-3 py-2 font-medium text-insight">{row.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
