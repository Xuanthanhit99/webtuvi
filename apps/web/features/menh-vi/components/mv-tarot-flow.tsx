'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Shuffle, Bookmark, Share2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mvTarotTopics, mvTarotReveal } from '../data/mock-tarot';

type Phase = 'topic' | 'deck' | 'revealed';

const DECK_SIZE = 5;

/**
 * Full topic -> deck -> shuffle -> pick -> flip -> reveal flow (brief's TAROT section).
 * Card art is ASSET-classified (docs/design/menh-vi-asset-requirements.md Assets 06-07) — this
 * component only owns interaction/layout, never fabricates the artwork itself.
 */
export function MvTarotFlow() {
  const [phase, setPhase] = useState<Phase>('topic');
  const [topic, setTopic] = useState<string | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  function chooseTopic(key: string) {
    setTopic(key);
    setPhase('deck');
  }

  function shuffle() {
    setShuffleCount((n) => n + 1);
  }

  function pick(index: number) {
    setPickedIndex(index);
    window.setTimeout(() => setFlipped(true), 250);
    window.setTimeout(() => setPhase('revealed'), 700);
  }

  function reset() {
    setPhase('topic');
    setTopic(null);
    setPickedIndex(null);
    setFlipped(false);
  }

  const topicLabel = mvTarotTopics.find((t) => t.key === topic)?.label;

  return (
    <div className="mx-auto max-w-mv-content px-4 py-10 tablet:px-6">
      <div className="text-center">
        <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Tarot</p>
        <h1 className="mt-2 font-display text-display-lg text-mv-text">
          {phase === 'topic' ? 'Chọn chủ đề bạn muốn khám phá' : topicLabel}
        </h1>
      </div>

      {phase === 'topic' && (
        <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-2">
          {mvTarotTopics.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => chooseTopic(t.key)}
              className="rounded-full border border-mv-border px-4 py-2 text-body-sm text-mv-text-secondary transition-colors duration-fast hover:border-mv-gold/40 hover:text-mv-text"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {phase === 'deck' && (
        <div className="mt-10 flex flex-col items-center">
          <div className="relative h-[220px] w-full max-w-md" key={shuffleCount}>
            {Array.from({ length: DECK_SIZE }).map((_, i) => {
              const jitter = ((i * 37 + shuffleCount * 53) % 9) - 4;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  aria-label={`Chọn lá bài thứ ${i + 1}`}
                  className="absolute left-1/2 top-0 transition-transform duration-standard ease-organic hover:-translate-y-2"
                  style={{
                    transform: `translateX(calc(-50% + ${(i - (DECK_SIZE - 1) / 2) * 34}px)) rotate(${jitter}deg)`,
                  }}
                >
                  <span className="relative block h-[190px] w-[118px] overflow-hidden rounded-lg border border-mv-border">
                    <Image
                      src="/assets/menh-vi/tarot/tarot-card-back.webp"
                      alt=""
                      fill
                      sizes="118px"
                      className="object-cover"
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={shuffle}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-mv-border px-4 py-2 text-body-sm text-mv-text-secondary transition-colors duration-fast hover:border-mv-gold/40 hover:text-mv-text"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Xáo bài
          </button>
          <p className="mt-3 text-caption text-mv-text-secondary">Chạm vào một lá bài để rút</p>
        </div>
      )}

      {(phase === 'deck' || phase === 'revealed') && pickedIndex !== null && (
        <div className="mt-10 flex flex-col items-center" style={{ perspective: '1000px' }}>
          <div
            className="relative h-[280px] w-[176px] transition-transform duration-[650ms] ease-organic"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-lg border border-mv-border"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Image src="/assets/menh-vi/tarot/tarot-card-back.webp" alt="" fill sizes="176px" className="object-cover" />
            </div>
            <div
              className="absolute inset-0 overflow-hidden rounded-lg border border-mv-border"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Image src="/assets/menh-vi/tarot/tarot-the-star.webp" alt="Lá bài The Star" fill sizes="176px" className="object-cover" />
            </div>
          </div>

          {phase === 'revealed' && (
            <div className={cn('mt-6 max-w-md text-center transition-opacity duration-standard', flipped ? 'opacity-100' : 'opacity-0')}>
              {/* Card art already carries "THE STAR" + "XVII" — a small caption pairs with it
                  instead of a second competing heading. */}
              <p className="text-caption uppercase tracking-wider text-mv-text-secondary">{mvTarotReveal.nameVi}</p>
              <p className="mt-3 text-body-sm text-mv-text-secondary">{mvTarotReveal.interpretation}</p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-mv-border px-4 py-2 text-body-sm text-mv-text-secondary transition-colors duration-fast hover:border-mv-gold/40 hover:text-mv-text"
                >
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Lưu lại
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-mv-border px-4 py-2 text-body-sm text-mv-text-secondary transition-colors duration-fast hover:border-mv-gold/40 hover:text-mv-text"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Chia sẻ
                </button>
              </div>
              <button type="button" onClick={reset} className="mt-6 text-caption text-mv-text-secondary underline-offset-4 hover:underline">
                Rút lại với chủ đề khác
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
