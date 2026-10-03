'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const INTENTS = [
  { key: 'love', label: 'Tình yêu', detail: 'Một mối quan hệ đang khiến tôi băn khoăn', title: 'Bắt đầu với Tarot', description: 'Khi câu hỏi đang ở ngay trong một mối quan hệ, Tarot cho bạn một điểm bắt đầu nhanh để gọi tên điều cần nhìn rõ.', href: '/discover/tarot', cta: 'Rút bài Tarot' },
  { key: 'work', label: 'Công việc', detail: 'Tôi cần nhìn rõ hướng đi tiếp theo', title: 'Bắt đầu với Tử Vi', description: 'Nhìn cấu trúc vận trình và các giai đoạn lớn khi bạn muốn đặt câu hỏi công việc vào một bức tranh dài hơn.', href: '/discover/tu-vi', cta: 'Xem Tử Vi' },
  { key: 'decision', label: 'Một quyết định', detail: 'Tôi đang đứng giữa những lựa chọn', title: 'Bắt đầu với Tarot', description: 'Dùng một câu hỏi cụ thể để soi lại điều bạn đang cân nhắc trước khi tự đưa ra quyết định.', href: '/discover/tarot', cta: 'Đặt câu hỏi Tarot' },
  { key: 'future', label: 'Tương lai', detail: 'Tôi muốn hiểu giai đoạn phía trước', title: 'Bắt đầu với Tử Vi', description: 'Đại Vận và Tiểu Hạn giúp bạn đọc giai đoạn trong cấu trúc lá số thay vì chỉ nhìn một khoảnh khắc.', href: '/discover/tu-vi', cta: 'Lập lá số' },
  { key: 'self', label: 'Hiểu bản thân', detail: 'Tôi muốn hiểu mình sâu hơn', title: 'Bắt đầu với Bản đồ sao', description: 'Khám phá khí chất, cách kết nối và các lớp trong bản đồ sinh; bạn vẫn có thể chuyển sang Thần số học sau đó.', href: '/discover/natal-chart', cta: 'Dựng Bản đồ sao' },
  { key: 'today', label: 'Chỉ muốn xem hôm nay', detail: 'Tôi cần một góc nhìn cho hiện tại', title: 'Bắt đầu với Tarot', description: 'Một trải bài ngắn là cách nhẹ nhất để dừng lại và nhìn vào điều đang hiện diện hôm nay.', href: '/discover/tarot', cta: 'Rút một lá' },
] as const;

export function HomeIntentRouter() {
  const [selectedKey, setSelectedKey] = useState<(typeof INTENTS)[number]['key']>('love');
  const selected = INTENTS.find((intent) => intent.key === selectedKey) ?? INTENTS[0];

  return (
    <section aria-labelledby="home-intent-heading" className="mx-auto w-full max-w-[1180px] px-1">
      <div className="max-w-2xl">
        <p className="text-caption font-semibold uppercase tracking-[0.2em] text-[#d5ad62]">Bắt đầu từ bạn</p>
        <h2 id="home-intent-heading" className="mt-2 font-display text-heading-lg text-[#f2eee5]">Điều gì đang khiến bạn bận lòng?</h2>
        <p className="mt-2 text-body-sm leading-relaxed text-[#aeb0b5]">Không cần biết trước nên dùng hệ nào. Chọn điều gần với câu hỏi của bạn hôm nay.</p>
      </div>

      <div aria-label="Các điều bạn muốn khám phá" className="mt-6 grid grid-cols-2 gap-2.5 tablet:grid-cols-3 tablet:gap-3">
        {INTENTS.map((intent) => {
          const active = intent.key === selected.key;
          return (
            <button key={intent.key} type="button" aria-pressed={active} onClick={() => setSelectedKey(intent.key)}
              className={`min-h-[92px] rounded-[16px] border p-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] tablet:min-h-[104px] tablet:p-4 ${active ? 'border-[#d5ad62]/70 bg-[#d5ad62]/[0.08]' : 'border-white/[0.08] bg-[#0b1220]/45 hover:border-[#d5ad62]/30'}`}>
              <span className="block font-display text-body-md text-[#f2eee5]">{intent.label}</span>
              <span className="mt-1.5 block text-caption leading-relaxed text-[#9fa2aa]">{intent.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-5 border-y border-white/[0.08] py-5 tablet:mt-6 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:gap-8 tablet:py-6">
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#bca1d5]">Gợi ý cho “{selected.label}”</p>
          <h3 className="mt-2 font-display text-heading-md text-[#f2eee5]">{selected.title}</h3>
          <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-[#aeb0b5]">{selected.description}</p>
        </div>
        <Link href={selected.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#070b12] transition-colors hover:bg-[#e6c980] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6c980]">
          {selected.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
