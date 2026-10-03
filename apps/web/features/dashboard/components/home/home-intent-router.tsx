'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Compass, Heart, Sparkles, Sunrise, UserRound } from 'lucide-react';

const INTENTS = [
  { key: 'love', label: 'Tình yêu', detail: 'Một mối quan hệ đang khiến tôi băn khoăn', eyebrow: 'Cho điều đang diễn ra ngay lúc này', title: 'Bắt đầu với Tarot', description: 'Đặt một câu hỏi cụ thể và dùng trải bài như một khoảng dừng để nhìn rõ điều đang hiện diện trong mối quan hệ.', href: '/discover/tarot', cta: 'Rút bài Tarot', icon: Heart },
  { key: 'work', label: 'Công việc', detail: 'Tôi cần nhìn rõ hướng đi tiếp theo', eyebrow: 'Cho một chặng đường dài hơn', title: 'Bắt đầu với Tử Vi', description: 'Đặt câu hỏi công việc vào cấu trúc vận trình, Đại Vận và Tiểu Hạn thay vì chỉ nhìn một khoảnh khắc riêng lẻ.', href: '/discover/tu-vi', cta: 'Xem Tử Vi', icon: BriefcaseBusiness },
  { key: 'decision', label: 'Một quyết định', detail: 'Tôi đang đứng giữa những lựa chọn', eyebrow: 'Cho điều cần được nhìn rõ', title: 'Bắt đầu với Tarot', description: 'Tarot giúp bạn soi lại điều đang cân nhắc trước khi tự đưa ra quyết định; kết quả không thay bạn lựa chọn.', href: '/discover/tarot', cta: 'Đặt câu hỏi Tarot', icon: Compass },
  { key: 'future', label: 'Tương lai', detail: 'Tôi muốn hiểu giai đoạn phía trước', eyebrow: 'Cho nhịp vận trình phía trước', title: 'Bắt đầu với Tử Vi', description: 'Đại Vận và Tiểu Hạn giúp bạn đọc giai đoạn phía trước trong cấu trúc lá số của chính mình.', href: '/discover/tu-vi', cta: 'Lập lá số', icon: Sunrise },
  { key: 'self', label: 'Hiểu bản thân', detail: 'Tôi muốn hiểu mình sâu hơn', eyebrow: 'Cho những lớp bên trong bạn', title: 'Bắt đầu với Bản đồ sao', description: 'Khám phá khí chất, cách kết nối và những lớp trong bản đồ sinh; sau đó bạn có thể đối chiếu thêm với Thần số học.', href: '/discover/natal-chart', cta: 'Dựng Bản đồ sao', icon: UserRound },
  { key: 'today', label: 'Chỉ muốn xem hôm nay', detail: 'Tôi cần một góc nhìn cho hiện tại', eyebrow: 'Cho một khoảng dừng ngắn', title: 'Bắt đầu với Tarot', description: 'Một trải bài ngắn là cách nhẹ nhất để dừng lại, gọi tên câu hỏi và nhìn vào điều đang hiện diện hôm nay.', href: '/discover/tarot', cta: 'Rút một lá', icon: Sparkles },
] as const;

export function HomeIntentRouter() {
  const [selectedKey, setSelectedKey] = useState<(typeof INTENTS)[number]['key']>('love');
  const selected = INTENTS.find((intent) => intent.key === selectedKey) ?? INTENTS[0];

  return (
    <section aria-labelledby="home-intent-heading" className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,24,39,0.96),rgba(8,13,23,0.9))]">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#8f6bc7]/[0.10] blur-3xl" aria-hidden="true" />
      <div className="grid desktop:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="relative p-5 min-[430px]:p-6 tablet:p-8 desktop:p-10">
          <p className="text-caption font-semibold uppercase tracking-[0.2em] text-[#d5ad62]">Bắt đầu từ điều bạn đang nghĩ tới</p>
          <h2 id="home-intent-heading" className="mt-2 max-w-2xl font-display text-[clamp(1.75rem,3vw,2.65rem)] font-semibold leading-tight text-[#f2eee5]">
            Điều gì đang khiến bạn bận lòng?
          </h2>
          <p className="mt-3 max-w-xl text-body-sm leading-relaxed text-[#aeb0b5]">
            Không cần biết trước nên dùng hệ nào. Chọn điều gần với câu hỏi của bạn hôm nay.
          </p>

          <div aria-label="Các điều bạn muốn khám phá" className="mt-6 grid grid-cols-2 gap-2.5 tablet:grid-cols-3 tablet:gap-3 desktop:grid-cols-2">
            {INTENTS.map((intent) => {
              const active = intent.key === selected.key;
              const Icon = intent.icon;
              return (
                <button
                  key={intent.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedKey(intent.key)}
                  className={`group min-h-[92px] rounded-[15px] border p-3.5 text-left transition-[border-color,background-color,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] tablet:min-h-[100px] tablet:p-4 ${active ? 'border-[#d5ad62]/70 bg-[#d5ad62]/[0.09]' : 'border-white/[0.07] bg-white/[0.025] hover:border-[#d5ad62]/30 hover:bg-white/[0.04]'}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${active ? 'text-[#e6c980]' : 'text-[#8f929a]'}`} aria-hidden="true" />
                    <span className="font-display text-body-md font-semibold text-[#f2eee5]">{intent.label}</span>
                  </span>
                  <span className="mt-1.5 block text-caption leading-relaxed text-[#9fa2aa]">{intent.detail}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex min-h-[300px] flex-col justify-between border-t border-white/[0.08] bg-[#0a101c]/65 p-5 min-[430px]:p-6 tablet:p-8 desktop:border-l desktop:border-t-0 desktop:p-10">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#bca1d5]">{selected.eyebrow}</p>
            <p className="mt-5 text-caption uppercase tracking-[0.14em] text-[#7f838d]">Mệnh Vi gợi ý</p>
            <h3 className="mt-2 font-display text-[clamp(1.65rem,2.5vw,2.35rem)] font-semibold leading-tight text-[#f2eee5]">{selected.title}</h3>
            <p className="mt-4 max-w-lg text-body-sm leading-7 text-[#b7b3ac]">{selected.description}</p>
          </div>
          <div className="mt-8 border-t border-white/[0.08] pt-5">
            <Link href={selected.href} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#070b12] transition-colors hover:bg-[#e6c980] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6c980] tablet:w-auto">
              {selected.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="mt-3 text-caption leading-relaxed text-[#777b84]">Bạn vẫn có thể khám phá các hệ khác ở phần bên dưới.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
