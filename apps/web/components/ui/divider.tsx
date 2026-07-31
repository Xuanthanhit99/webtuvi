export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border-subtle" />;
  return (
    <div className="flex items-center gap-3" role="separator">
      <hr className="flex-1 border-border-subtle" />
      <span className="text-caption text-text-secondary">{label}</span>
      <hr className="flex-1 border-border-subtle" />
    </div>
  );
}
