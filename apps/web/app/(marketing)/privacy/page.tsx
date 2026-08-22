import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Notice',
  description: 'How Tử Vi Tarot handles your data — what is collected, how it is used, and your rights to export or delete it.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader eyebrow="Quyền riêng tư" title="Privacy Notice" description="How Tử Vi Tarot handles your data and the controls available to you." />
      <div className="flex flex-col gap-4 text-body-md text-text-secondary">
        <p>
          Your conversations and journal entries are private by default. We don&rsquo;t sell your data, and we
          don&rsquo;t use your conversations to train models without your explicit, specific consent.
        </p>
        <p>
          You can export a copy of everything we hold about you, or delete your account and its data entirely,
          at any time from Settings. Deleting your account immediately removes your Companion conversations,
          Memory, Journal entries, and Discovery readings (Tarot, Numerology, Natal Chart), and ends your
          Premium access. A record of past payments is kept for accounting purposes, but it no longer carries
          any personal profile information once your account is deleted.
        </p>
        <p>
          We use essential cookies to keep you signed in securely. We don&rsquo;t set marketing or tracking
          cookies before you&rsquo;ve had a chance to review this notice.
        </p>
        <p>
          Tarot, Numerology, and Natal Chart results are calculated by deterministic, non-AI systems &mdash; a real
          card draw, a real numerology formula, a real astronomical calculation. AI is only ever used afterward, to
          help explain or reflect on a result that&rsquo;s already been calculated. It never chooses a card, picks a
          number, or determines a chart placement.
        </p>
        <p className="text-body-sm text-text-tertiary">
          This is a plain-language summary for Sprint 1. A complete legal Privacy Policy will be published
          before general availability.
        </p>
      </div>
      </MvPage>
    </main>
  );
}
