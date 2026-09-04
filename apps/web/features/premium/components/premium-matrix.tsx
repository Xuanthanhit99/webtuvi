import { Check } from 'lucide-react';

const ROWS = [
  { capability: 'Lá bài mỗi ngày', free: '1 / ngày', premium: '1 / ngày' },
  { capability: 'Trải một lá', free: '3 / ngày', premium: '15 / ngày' },
  { capability: 'Trải ba lá', free: '1 / ngày', premium: '10 / ngày' },
  { capability: 'Luận giải', free: 'Cơ bản', premium: 'Sâu hơn, cá nhân hóa bằng ký ức' },
  { capability: 'Lịch sử đọc', free: '20 lần gần nhất', premium: 'Không giới hạn' },
] as const;

export function PremiumMatrix() {
  return (
    <section aria-labelledby="comparison-heading" className="overflow-hidden rounded-xl border border-white/10 bg-[#0a101c]">
      <div className="border-b border-white/10 px-5 py-5 tablet:px-7"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Quyền lợi thực tế</p><h2 id="comparison-heading" className="mt-1 font-display text-heading-md text-text-primary">Free và Premium khác nhau thế nào?</h2></div>
      <div className="hidden grid-cols-[minmax(12rem,1.1fr)_minmax(9rem,.7fr)_minmax(13rem,1fr)] tablet:grid">
        <div className="border-b border-white/10 px-6 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-text-tertiary">Quyền lợi</div><div className="border-b border-l border-white/10 px-6 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-text-secondary">Free</div><div className="border-b border-l border-[#d5ad62]/20 bg-[#d5ad62]/[0.045] px-6 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-[#e6c980]">Premium</div>
        {ROWS.map((row) => <div key={row.capability} className="contents"><div className="border-b border-white/[0.07] px-6 py-4 text-body-sm font-medium text-text-primary">{row.capability}</div><div className="border-b border-l border-white/[0.07] px-6 py-4 text-body-sm text-text-secondary">{row.free}</div><div className="flex gap-2 border-b border-l border-[#d5ad62]/15 bg-[#d5ad62]/[0.035] px-6 py-4 text-body-sm font-medium text-text-primary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d5ad62]" aria-hidden="true" />{row.premium}</div></div>)}
      </div>
      <div className="divide-y divide-white/[0.07] tablet:hidden">
        {ROWS.map((row) => <div key={row.capability} className="px-5 py-4"><h3 className="text-body-sm font-semibold text-text-primary">{row.capability}</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-body-sm"><div><dt className="text-caption uppercase tracking-wider text-text-tertiary">Free</dt><dd className="mt-1 text-text-secondary">{row.free}</dd></div><div><dt className="text-caption uppercase tracking-wider text-[#d5ad62]">Premium</dt><dd className="mt-1 text-text-primary">{row.premium}</dd></div></dl></div>)}
      </div>
    </section>
  );
}
