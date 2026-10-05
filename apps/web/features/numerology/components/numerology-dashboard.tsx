'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { NumerologyForm } from './numerology-form';
import { NumerologyHistoryList } from './numerology-history-list';
import { NumerologyReadingDetail } from './numerology-reading-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { trackGoogleFunnelEvent } from '@/components/analytics/google-measurement';

export function NumerologyDashboard() {
  const router = useRouter();
  const activeId = useSearchParams().get('item');

  useEffect(() => {
    trackGoogleFunnelEvent('tool_view', 'numerology');
  }, []);
  const selectItem = (id: string | null) => router.replace(id ? `/discover/numerology?item=${id}` : '/discover/numerology', { scroll: false });
  if (activeId) return <NumerologyReadingDetail id={activeId} onClose={() => selectItem(null)} />;

  return (
    <MvPage className="gap-8 pb-10 tablet:gap-10">
      <header className="border-b border-[#b78ad0]/15 pb-6 tablet:pb-8">
        <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#c39cdb]">Thần số học · Pythagoras</p>
        <h1 className="mt-3 max-w-3xl font-serif text-heading-xl leading-tight text-text-primary tablet:text-display-sm">Những con số kể câu chuyện riêng của bạn</h1>
        <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-text-secondary">Bắt đầu từ họ tên khai sinh và ngày sinh. Kết quả được tính nhất quán, giữ nguyên số đặc biệt 11 · 22 · 33 và cho phép xem lại từng bước.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-caption text-text-secondary">
          <span className="rounded-full border border-[#b78ad0]/20 px-3 py-1.5">6 chỉ số cá nhân</span>
          <span className="rounded-full border border-[#b78ad0]/20 px-3 py-1.5">Cách tính minh bạch</span>
          <span className="rounded-full border border-[#b78ad0]/20 px-3 py-1.5">AI chỉ diễn giải kết quả</span>
        </div>
      </header>

      <MvSection eyebrow="Bước 01 · Thông tin cá nhân" title="Tạo hồ sơ số học">
        <div id="numerology-form" className="scroll-mt-6" />
        <NumerologyForm />
      </MvSection>

      <MvSection eyebrow="Hồ sơ đã lưu" title="Xem lại hành trình của bạn">
        <NumerologyHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
