'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Eye, Library, MoonStar, Sparkles } from 'lucide-react';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { tarotApi } from '../api/tarot-api';
import { TarotReadingView } from './tarot-reading-view';
import { TarotCardVisual } from './tarot-card-face';
import { READING_TYPE_DESCRIPTIONS, READING_TYPE_LABELS } from '../labels';
import { TAROT_CARD_BACK_SRC } from '../artwork';
import { useTarotRitual } from '../ritual/use-tarot-ritual';
import { RitualStage } from '../ritual/ritual-stage';
import { TarotDeckShuffle } from '../ritual/tarot-deck-shuffle';
import { TarotRevealSequence } from '../ritual/tarot-reveal-sequence';

const READING_TYPES: TarotReadingTypeValue[] = ['DAILY_DRAW', 'SINGLE_CARD', 'THREE_CARD'];

const ANALYTICS_SPREAD_TYPE: Record<TarotReadingTypeValue, 'daily_draw' | 'single_card' | 'three_card'> = {
  DAILY_DRAW: 'daily_draw',
  SINGLE_CARD: 'single_card',
  THREE_CARD: 'three_card',
};

const CARD_COUNT: Record<TarotReadingTypeValue, number> = {
  DAILY_DRAW: 1,
  SINGLE_CARD: 1,
  THREE_CARD: 3,
};

const INTENTIONS = [
  { id: 'GENERAL', label: 'Tổng quan', helper: 'Nhìn rộng vào điều đang hiện diện.' },
  { id: 'LOVE', label: 'Tình cảm', helper: 'Quan sát kết nối, mong muốn và ranh giới.' },
  { id: 'CAREER', label: 'Sự nghiệp', helper: 'Làm rõ hướng đi, nhịp làm việc và lựa chọn.' },
  { id: 'FINANCE', label: 'Tài chính', helper: 'Soi lại sự ổn định, cơ hội và mức rủi ro.' },
  { id: 'SELF', label: 'Bản thân', helper: 'Quay về cảm xúc, trực giác và sức bền bên trong.' },
  { id: 'DECISION', label: 'Quyết định', helper: 'Giữ câu hỏi đủ gọn để nhìn thấy bước kế tiếp.' },
] as const;

type Phase = 'landing' | 'intention' | 'spread' | 'focus' | 'select' | 'revealed';

const TAROT_PANEL =
  'relative overflow-hidden rounded-md border border-[rgba(213,173,98,0.34)] bg-[#07111D] shadow-[0_24px_80px_rgba(0,0,0,0.34)]';
const TAROT_STARS =
  "before:pointer-events-none before:absolute before:inset-0 before:opacity-35 before:[background-image:radial-gradient(circle,rgba(234,194,126,0.78)_1px,transparent_1.4px),radial-gradient(circle,rgba(236,232,220,0.32)_1px,transparent_1.6px)] before:[background-position:0_0,18px_22px] before:[background-size:48px_48px,76px_76px]";

function drawLimitBanner(error: unknown): { message: string; showUpgrade: boolean } | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'PREMIUM_REQUIRED') return { message: error.message, showUpgrade: true };
  if (error.code === 'TAROT_DAILY_LIMIT_REACHED' || error.code === 'TAROT_DAILY_DRAW_ALREADY_TAKEN') {
    return { message: error.message, showUpgrade: false };
  }
  return null;
}

export function TarotDrawPanel({ onDrawn }: { onDrawn?: (reading: TarotReadingDto) => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('landing');
  const [type, setType] = useState<TarotReadingTypeValue>('DAILY_DRAW');
  const [intention, setIntention] = useState<(typeof INTENTIONS)[number]['id']>('GENERAL');
  const [question, setQuestion] = useState('');
  const [pendingReading, setPendingReading] = useState<TarotReadingDto | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [result, setResult] = useState<TarotReadingDto | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const count = CARD_COUNT[type];
  const activeIntention = useMemo(() => INTENTIONS.find((item) => item.id === intention) ?? INTENTIONS[0], [intention]);

  const ritual = useTarotRitual();
  const draw = useMutation({
    mutationFn: () => tarotApi.draw(type, type === 'DAILY_DRAW' ? undefined : question.trim() || undefined),
    onSuccess: (reading) => {
      setPendingReading(reading);
      setSelectedSlots([]);
      setPhase('select');
      queryClient.invalidateQueries({ queryKey: ['tarot'] });
    },
    onError: (error: unknown) => {
      setPhase('spread');
      const banner = drawLimitBanner(error);
      if (banner) {
        setLimitBanner(banner);
        return;
      }
      const message = error instanceof Error ? error.message : "Couldn't draw a card. Please try again.";
      toast.error(message);
    },
  });

  function beginFocus() {
    setLimitBanner(null);
    setPendingReading(null);
    setResult(null);
    setSelectedSlots([]);
    setPhase('focus');
    ritual.startShuffle();
    trackEvent('tarot_started', { feature: 'tarot', spreadType: ANALYTICS_SPREAD_TYPE[type] });
    draw.mutate();
  }

  function skipShuffle() {
    ritual.skipShuffle();
  }

  // Roving keyboard nav across the fan (Tab/Enter already work via native buttons — this adds
  // Arrow/Home/End movement between the *selectable* cards, skipping decorative filler and
  // whichever cards have already flown out to the placement row).
  const fanRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  function handleFanKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const focusable = Array.from({ length: count }, (_, i) => i).filter((i) => !selectedSlots.includes(i));
    if (focusable.length === 0) return;
    const activeIndex = Number((document.activeElement as HTMLElement | null)?.dataset.fanIndex ?? -1);
    const currentPos = focusable.indexOf(activeIndex);
    let nextPos = currentPos;
    if (event.key === 'ArrowLeft') nextPos = currentPos <= 0 ? focusable.length - 1 : currentPos - 1;
    else if (event.key === 'ArrowRight') nextPos = currentPos === -1 ? 0 : (currentPos + 1) % focusable.length;
    else if (event.key === 'Home') nextPos = 0;
    else if (event.key === 'End') nextPos = focusable.length - 1;
    event.preventDefault();
    fanRefs.current[focusable[nextPos]!]?.focus();
  }

  function selectSlot(index: number) {
    if (!pendingReading || selectedSlots.includes(index) || selectedSlots.length >= count) return;
    const next = [...selectedSlots, index];
    setSelectedSlots(next);
    if (next.length === count) {
      setResult(pendingReading);
      setPhase('revealed');
      onDrawn?.(pendingReading);
    }
  }

  // Ritual-only: the reveal-flip sequence starts once the real result is committed, kept in a
  // separate effect rather than inline in `selectSlot` so it can't influence the business
  // transition it's reacting to.
  useEffect(() => {
    if (phase === 'revealed') {
      ritual.startReveal(count);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function refreshResult() {
    if (!result) return;
    const fresh = await tarotApi.getReading(result.id);
    setResult(fresh);
  }

  function reset() {
    setPhase('landing');
    setPendingReading(null);
    setSelectedSlots([]);
    setResult(null);
    setLimitBanner(null);
    ritual.resetRitual();
  }

  if (phase === 'revealed' && result) {
    if (ritual.revealStage !== 'done') {
      return (
        <MotionConfig reducedMotion="user">
          <RitualStage>
            <TarotRevealSequence reading={result} revealStage={ritual.revealStage} onSkip={ritual.skipReveal} />
          </RitualStage>
        </MotionConfig>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <TarotReadingView reading={result} onChanged={refreshResult} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            Rút trải bài khác
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPhase('select')}>
            Xem lại bước chọn bài
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className={`${TAROT_PANEL} ${TAROT_STARS}`}>
      {phase !== 'landing' && (
        <div className="relative flex items-center justify-between gap-3 border-b border-[rgba(213,173,98,0.18)] bg-[#101827]/70 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase(phase === 'spread' ? 'landing' : phase === 'intention' ? 'spread' : 'intention')}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Quay lại
          </Button>
          <span className="text-caption text-text-tertiary">{activeIntention.label} · {READING_TYPE_LABELS[type]}</span>
        </div>
      )}

      {phase === 'landing' && (
        <section className="relative grid gap-6 p-4 tablet:grid-cols-[0.9fr_1.1fr] tablet:p-6">
          <div className="flex flex-col justify-center gap-4 py-4">
            <div className="flex items-center gap-2 text-caption font-semibold uppercase text-insight">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Tarot
            </div>
            <div>
              <h2 className="font-display text-heading-lg text-text-primary tablet:text-display-md">Điều gì đang gọi bạn?</h2>
              <p className="mt-3 max-w-md text-body-md text-text-secondary">
                Hãy để Tarot soi sáng những khúc mắc trong lòng bằng bộ 78 lá thật, được rút và lưu từ hệ thống.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setPhase('spread')}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Bắt đầu trải bài
              </Button>
              <a href="#tarot-library" className="inline-flex h-11 items-center gap-2 rounded-md border border-insight/35 px-4 text-body-md font-semibold text-text-primary transition hover:border-insight hover:bg-insight/5">
                <Library className="h-4 w-4" aria-hidden="true" />
                Thư viện 78 lá
              </a>
            </div>
          </div>
          <div className="relative min-h-80">
            <div className="absolute inset-x-8 bottom-4 h-20 rounded-[50%] border border-insight/20 opacity-70" aria-hidden="true" />
            <div className="relative flex h-full scale-[0.82] items-center justify-center tablet:scale-100">
              <div className="-mr-12 rotate-[-18deg] opacity-80"><TarotCardVisual id="hero-star" name="The Star" size="md" imageSrc="/assets/tarot-card/17-the-star.webp" /></div>
              <div className="z-[1] rotate-[6deg]"><TarotCardVisual id="hero-back" name="Mặt sau lá Tarot" size="lg" revealed={false} backImageSrc={TAROT_CARD_BACK_SRC} /></div>
              <div className="-ml-14 mt-10 rotate-[17deg] opacity-85"><TarotCardVisual id="hero-cups" name="Ace of Cups" size="md" imageSrc="/assets/tarot-card/cups-ace.webp" /></div>
            </div>
          </div>
        </section>
      )}

      {phase === 'intention' && (
        <section className="relative grid gap-6 p-4 tablet:grid-cols-[0.85fr_1.15fr] tablet:p-6">
          <div>
            <h2 className="font-display text-heading-lg text-insight">Đặt câu hỏi của bạn</h2>
            <p className="mt-2 text-body-sm text-text-secondary">Chọn một chủ đề để định hướng suy ngẫm, rồi viết câu hỏi nếu bạn muốn. Câu hỏi có thể để trống.</p>
          </div>
          <div className="flex flex-col gap-4">
          <div className="grid gap-3 tablet:grid-cols-2">
            {INTENTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntention(item.id)}
                aria-pressed={intention === item.id}
                className={`min-h-24 rounded-md border p-3 text-left transition hover:-translate-y-0.5 motion-reduce:transform-none ${
                  intention === item.id ? 'border-insight bg-[#17172D] text-text-primary shadow-[0_0_0_1px_rgba(213,173,98,0.18)]' : 'border-[rgba(213,173,98,0.18)] bg-[#081522]/85 hover:border-insight/50'
                }`}
              >
                <span className="block text-body-sm font-semibold text-text-primary">{item.label}</span>
                <span className="mt-2 block text-caption leading-relaxed text-text-secondary">{item.helper}</span>
              </button>
            ))}
          </div>
          <FormField label="Câu hỏi của bạn (không bắt buộc)" htmlFor="tarot-question">
            <textarea
              id="tarot-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Điều gì đang khiến bạn muốn dừng lại và nhìn kỹ hơn?"
              className="w-full resize-none rounded-md border border-[rgba(213,173,98,0.28)] bg-[#0A1622] px-3 py-2 text-body-md text-text-primary placeholder:text-text-tertiary focus:border-insight/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
            />
          </FormField>
          <Button onClick={beginFocus} loading={draw.isPending} className="self-start">
            <MoonStar className="h-4 w-4" aria-hidden="true" />
            Tập trung và xáo bài
          </Button>
          </div>
        </section>
      )}

      {phase === 'spread' && (
        <section className="relative flex flex-col gap-5 p-4 tablet:p-6">
          <div className="text-center">
            <h2 className="font-display text-heading-lg text-insight">Chọn kiểu trải bài</h2>
            <p className="mt-2 text-body-sm text-text-secondary">Ba cách trải bài, từ một khoảnh khắc ngắn đến góc nhìn theo dòng thời gian.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
            {READING_TYPES.map((readingType) => (
              <button
                key={readingType}
                type="button"
                onClick={() => setType(readingType)}
                aria-pressed={type === readingType}
                className={`group flex min-h-52 flex-col justify-between gap-3 rounded-md border p-3 text-center transition duration-fast hover:-translate-y-0.5 motion-reduce:transform-none ${
                  type === readingType ? 'border-insight bg-[#17172D] shadow-[0_18px_48px_rgba(213,173,98,0.10)]' : 'border-[rgba(213,173,98,0.18)] bg-[#081522]/85 hover:border-insight'
                }`}
              >
                <span className="flex min-h-28 justify-center gap-1.5" aria-hidden="true">
                  {Array.from({ length: CARD_COUNT[readingType] }).map((_, index) => (
                    <span key={index} className="scale-[0.58]" style={{ transform: CARD_COUNT[readingType] > 1 ? `translateY(${index === 1 ? -8 : 5}px) rotate(${(index - 1) * 7}deg)` : undefined }}>
                      <TarotCardVisual id={`${readingType}-${index}`} name={READING_TYPE_LABELS[readingType]} size="sm" revealed={false} backImageSrc={TAROT_CARD_BACK_SRC} />
                    </span>
                  ))}
                </span>
                <span>
                  <span className="block text-body-sm font-semibold text-text-primary">{READING_TYPE_LABELS[readingType]}</span>
                  <span className="mt-1 block text-caption leading-relaxed text-insight">{CARD_COUNT[readingType]} lá bài</span>
                  <span className="mt-1 block text-caption leading-relaxed text-text-secondary">{READING_TYPE_DESCRIPTIONS[readingType]}</span>
                </span>
              </button>
            ))}
          </div>

          {limitBanner && (
            <div role="alert" className="flex flex-col gap-2 rounded-md border border-insight/30 bg-insight/5 px-4 py-3 text-body-sm text-text-primary">
              <span>{limitBanner.message}</span>
              {limitBanner.showUpgrade && (
                <Link href="/premium?reason=required" className="self-start">
                  <Button variant="secondary" size="sm">Nâng cấp Premium</Button>
                </Link>
              )}
            </div>
          )}

          <Button onClick={() => setPhase('intention')} className="self-center">Tiếp tục</Button>
        </section>
      )}

      {phase === 'focus' && (
        <RitualStage>
          <section className="relative flex min-h-96 flex-col items-center justify-center gap-6 p-8 text-center" role="status">
            <TarotDeckShuffle stage={ritual.shuffleStage} reducedMotion={ritual.reducedMotion} onSkip={skipShuffle} />
            <div>
              <p className="font-display text-heading-md text-insight">Hãy tập trung và chọn {count} lá bài</p>
              <p className="mt-2 max-w-md text-body-sm text-text-secondary">Lá bài đã được hệ thống rút một cách nhất quán; khoảnh khắc này chỉ để bạn chậm lại trước khi lật bài.</p>
            </div>
          </section>
        </RitualStage>
      )}

      {phase === 'select' && pendingReading && (
        <RitualStage>
          <section className="relative flex flex-col items-center gap-5 p-4 tablet:p-6">
            <div className="text-center">
              <h2 className="font-display text-heading-lg text-insight">Chọn lá bài úp</h2>
              <p className="mt-2 text-body-sm text-text-secondary" aria-live="polite">
                Đã chọn {selectedSlots.length} / {count}
              </p>
            </div>
            {/* Fixed-width placement slots + the fan below both size for desktop first — at
                390px wide that's wider than the viewport (3 slots alone run ~400px), so this
                whole block scales down on mobile only (same shrink-for-mobile pattern as the
                landing hero above) rather than resizing the shared `TarotCardVisual` sizes
                themselves, which other Tarot views also depend on. */}
            <div className="w-full origin-top scale-[0.72] tablet:scale-100">
            {/* Placement row: a selected fan card shares a `layoutId` with its slot here, so
                framer-motion animates the flight from fan position to slot automatically instead
                of an instant jump. Purely presentational — slot order just mirrors selection
                order, it carries no card identity of its own. */}
            <div className="flex justify-center gap-2 tablet:gap-3" aria-hidden="true">
              {Array.from({ length: count }).map((_, slotPos) => {
                const filledIndex = selectedSlots[slotPos];
                return (
                  <div key={slotPos} className="flex h-48 w-32 items-center justify-center rounded-md border border-dashed border-insight/25">
                    {filledIndex !== undefined ? (
                      <motion.span layout layoutId={`tarot-fan-card-${filledIndex}`} transition={{ duration: ritual.reducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}>
                        <TarotCardVisual id={`select-${filledIndex}`} name="Mặt sau lá Tarot" size="md" revealed={false} backImageSrc={TAROT_CARD_BACK_SRC} />
                      </motion.span>
                    ) : (
                      <span className="text-caption text-text-tertiary">{slotPos + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex w-full flex-wrap justify-center gap-2 tablet:gap-3" onKeyDown={handleFanKeyDown}>
              {(() => {
                const totalSlots = Math.max(7, count + 4);
                // Rotation/lift is keyed to each card's position *among the cards still in the
                // fan*, not its original slot index — otherwise the remaining cards keep their
                // old curve values after one flies out, and the arc reads as broken/lopsided
                // instead of re-settling into a smooth fan (confirmed visually during QA).
                const remaining = Array.from({ length: totalSlots }, (_, i) => i).filter((i) => !selectedSlots.includes(i));
                const remainingCenter = (remaining.length - 1) / 2;
                return remaining.map((index, visualPos) => {
                  const available = index < count;
                  return (
                    <motion.button
                      key={index}
                      ref={(el) => {
                        fanRefs.current[index] = el;
                      }}
                      data-fan-index={index}
                      type="button"
                      disabled={!available}
                      aria-label={available ? `Chọn lá ${index + 1}` : `Lá trang trí ${index + 1}`}
                      onClick={() => selectSlot(index)}
                      layout
                      layoutId={`tarot-fan-card-${index}`}
                      style={{ y: Math.abs(visualPos - remainingCenter) * 3, rotate: (visualPos - remainingCenter) * 6 }}
                      whileHover={available ? { y: -14, scale: 1.04 } : undefined}
                      whileFocus={available ? { y: -14, scale: 1.04 } : undefined}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className={`transition-[filter] duration-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight motion-reduce:transform-none ${
                        available ? 'hover:brightness-110' : 'opacity-35'
                      }`}
                    >
                      <TarotCardVisual id={`select-${index}`} name="Mặt sau lá Tarot" size="md" revealed={false} backImageSrc={TAROT_CARD_BACK_SRC} />
                    </motion.button>
                  );
                });
              })()}
            </div>
            </div>
            <p className="max-w-lg text-center text-caption text-text-tertiary">
              Vị trí bạn bấm chỉ chọn slot úp; card ID và chiều xuôi/ngược không bao giờ được gửi từ trình duyệt.
            </p>
          </section>
        </RitualStage>
      )}

      <div className="border-t border-insight/10 px-4 py-3 text-caption text-text-tertiary">
        <Eye className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        Tarot là gợi ý phản chiếu, không phải cam kết dự đoán chắc chắn.
      </div>
    </div>
    </MotionConfig>
  );
}
