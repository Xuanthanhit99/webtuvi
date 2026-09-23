'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TarotCardDto, TarotSuitValue } from '@beaconvie/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { tarotApi } from '../api/tarot-api';
import { TarotCardVisual } from './tarot-card-face';
import { TarotCardDetailDialog } from './tarot-card-detail-dialog';
import { SUIT_LABELS } from '../labels';
import { resolveTarotArtworkSrc } from '../artwork';

type LibraryFilter = 'ALL' | 'MAJOR' | TarotSuitValue;

const FILTERS: Array<{ id: LibraryFilter; label: string; count: number }> = [
  { id: 'ALL', label: 'Tất cả', count: 78 },
  { id: 'MAJOR', label: 'Ẩn chính', count: 22 },
  { id: 'WANDS', label: 'Gậy', count: 14 },
  { id: 'CUPS', label: 'Cốc', count: 14 },
  { id: 'SWORDS', label: 'Kiếm', count: 14 },
  { id: 'PENTACLES', label: 'Tiền', count: 14 },
];

function matchesFilter(card: TarotCardDto, filter: LibraryFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'MAJOR') return card.arcana === 'MAJOR';
  return card.suit === filter;
}

export function TarotLibrary() {
  const [opened, setOpened] = useState(false);
  const [filter, setFilter] = useState<LibraryFilter>('ALL');
  const [search, setSearch] = useState('');
  const [detailCard, setDetailCard] = useState<TarotCardDto | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tarot', 'deck'], queryFn: () => tarotApi.listDeck(), enabled: opened });

  const cards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((card) => {
      if (!matchesFilter(card, filter)) return false;
      if (!q) return true;
      return card.name.toLowerCase().includes(q) || card.nameVi.toLowerCase().includes(q) || card.slug.toLowerCase().includes(q);
    });
  }, [data, filter, search]);

  return (
    <div id="tarot-library" className="relative flex flex-col gap-4 overflow-hidden rounded-md border border-[rgba(213,173,98,0.28)] bg-[#07111D] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] before:pointer-events-none before:absolute before:inset-0 before:opacity-20 before:[background-image:radial-gradient(circle,rgba(234,194,126,0.72)_1px,transparent_1.4px)] before:[background-size:52px_52px]">
      <div className="relative flex flex-col gap-3 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-insight">Thư viện Tarot 78 lá</h2>
          <p className="mt-1 text-body-sm text-text-secondary">Khám phá ý nghĩa và hình ảnh của trọn bộ 78 lá. Thư viện chỉ tải khi bạn mở để hành trình rút bài luôn nhẹ nhàng.</p>
        </div>
        {opened ? (
          <div className="w-full tablet:max-w-xs">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên lá bài" aria-label="Tìm lá bài Tarot" />
          </div>
        ) : (
          <Button onClick={() => setOpened(true)} className="self-start tablet:self-auto">Mở thư viện 78 lá</Button>
        )}
      </div>

      {!opened && (
        <div className="relative rounded-md border border-[rgba(213,173,98,0.18)] bg-[#0A1622]/85 p-4 text-body-sm text-text-secondary">
          Bộ bài gồm 22 lá Ẩn chính và 56 lá Ẩn phụ thuộc bốn chất Gậy, Cốc, Kiếm và Tiền.
        </div>
      )}

      {isLoading && <Skeleton className="h-72 w-full" />}
      {isError && <ErrorState description="Chưa thể tải thư viện Tarot." onRetry={() => refetch()} />}
      {opened && data && (
        <>

      <div className="relative flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Bộ lọc thư viện Tarot">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-md border px-3 py-2 text-body-sm transition ${
              filter === item.id ? 'border-insight bg-[#17172D] text-text-primary' : 'border-[rgba(213,173,98,0.18)] bg-[#081522]/85 text-text-secondary hover:border-insight/50'
            }`}
          >
            {item.label} <span className="text-caption text-text-tertiary">({item.count})</span>
          </button>
        ))}
      </div>

      <div className="relative grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-5">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setDetailCard(card)}
            className="flex min-h-72 flex-col items-center gap-3 rounded-md border border-[rgba(213,173,98,0.18)] bg-[#0A1622]/90 p-3 text-center transition hover:-translate-y-0.5 hover:border-insight/60 motion-reduce:transform-none"
          >
            <TarotCardVisual id={card.id} name={card.name} imageSrc={resolveTarotArtworkSrc(card)} size="sm" numberLabel={String(card.number).padStart(2, '0')} />
            <span>
              <span className="block text-body-sm font-semibold text-text-primary">{card.name}</span>
              <span className="block text-caption text-text-secondary">{card.nameVi}</span>
            </span>
            <span className="flex flex-wrap justify-center gap-1">
              <Badge variant="neutral">{card.arcana === 'MAJOR' ? 'Ẩn chính' : 'Ẩn phụ'}</Badge>
              {card.suit && <Badge variant="neutral">{SUIT_LABELS[card.suit]}</Badge>}
            </span>
          </button>
        ))}
      </div>

      <p className="relative text-caption text-text-tertiary" aria-live="polite">
        Đang hiển thị {cards.length} / {data.length} lá bài.
      </p>

      <TarotCardDetailDialog card={detailCard} isReversed={false} open={detailCard !== null} onClose={() => setDetailCard(null)} />
        </>
      )}
    </div>
  );
}
