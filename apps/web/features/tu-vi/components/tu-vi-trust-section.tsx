'use client';

import { useId, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const GLOSSARY: Array<{ term: string; description: string }> = [
  {
    term: '12 Cung',
    description: '12 khu vực cố định của lá số (Mệnh, Tài Bạch, Quan Lộc, Phu Thê...), mỗi cung đại diện cho một phần trong đời sống.',
  },
  {
    term: 'Mệnh / Thân / Cục',
    description: 'Mệnh là cung chủ đạo của lá số. Thân bổ sung thêm khía cạnh vận động của cuộc đời. Cục là nhóm ngũ hành xác định nhịp độ an sao.',
  },
  {
    term: '14 Chính Tinh',
    description: '14 sao chính — mỗi cung được an đúng một hoặc nhiều sao trong nhóm này, theo vị trí được tính từ ngày giờ sinh.',
  },
  {
    term: 'Phụ tinh',
    description: 'Các sao bổ trợ được an theo quy tắc cố định để làm rõ thêm sắc thái của từng cung, không phải do AI thêm vào.',
  },
  {
    term: 'Tuần / Triệt',
    description: 'Hai vùng ảnh hưởng làm giảm hoặc che mờ tạm thời ý nghĩa của cung mà chúng đi qua.',
  },
  {
    term: 'Tứ Hóa',
    description: '4 sao được "hóa" theo Can năm sinh, cho biết cung nào đang được nhấn mạnh nhiều nhất trong lá số này.',
  },
];

/**
 * Phase B (2026-08-22) — dedicated Tử Vi trust/source-transparency section, distinct from the
 * inline "Deterministic — never AI-generated" badge in `TuViChartView`. Plain-language glossary
 * only; deliberately never renders an internal RULE_ID/engine constant/ruleset version string.
 */
export function TuViTrustSection({ defaultOpen = false, context }: { defaultOpen?: boolean; context?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  // TuViDashboard and TuViChartView can both have a TuViTrustSection mounted at the same time
  // (once a chart is calculated on /discover/tu-vi) — a hardcoded id here would duplicate on the
  // page (invalid HTML, and axe's landmark-unique violation, found during the Time Cycles QA pass).
  const headingId = useId();
  const bodyId = useId();

  return (
    <section aria-labelledby={headingId} className="rounded-lg border border-[rgba(213,173,98,0.25)] bg-surface p-4">
      <button
        type="button"
        id={headingId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-insight" aria-hidden="true" />
          <span className="text-body-sm font-semibold text-text-primary">
            AI không an sao cho bạn
            {/* Same visible copy in both mount points by design; this sr-only suffix only
                differentiates the two landmarks' accessible names for assistive tech (axe
                landmark-unique) — never seen by sighted users. */}
            {context && <span className="sr-only"> — {context}</span>}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-fast ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={bodyId} className="mt-3 flex flex-col gap-4">
          <p className="text-body-sm leading-relaxed text-text-secondary">
            Lá số được tính bằng một hệ thống quy tắc xác định (deterministic) từ ngày, giờ sinh và giới tính bạn nhập — cung, sao và Tứ Hóa
            không phải do AI lựa chọn hay bịa ra. AI chỉ được dùng ở bước sau, để giải thích ý nghĩa của kết quả đã được an sẵn.
          </p>

          <dl className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
            {GLOSSARY.map(({ term, description }) => (
              <div key={term}>
                <dt className="text-body-sm font-semibold text-text-primary">{term}</dt>
                <dd className="mt-0.5 text-caption text-text-secondary">{description}</dd>
              </div>
            ))}
          </dl>

          <p className="border-t border-border-subtle pt-3 text-caption text-text-tertiary">
            Trường phái / nguồn V1: Vân Đằng Thái Thứ Lang — Tử Vi Đẩu Số Tân Biên (1956). Đây là phương pháp luận Tử Vi Tarot dùng để lập lá
            số, không phải một tuyên bố về chân lý tuyệt đối.
          </p>
        </div>
      )}
    </section>
  );
}
