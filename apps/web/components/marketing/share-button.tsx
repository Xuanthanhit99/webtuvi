'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/seo';

/**
 * SEO + Shareability Foundation. Shares the public homepage only — title, description, and URL
 * are all the same values already public in the page's own metadata, never anything user-specific
 * (no birth data, no reading result, no account identity — see the final report's §8/§16 for the
 * adversarial privacy test this is designed to pass). Web Share API where available (mobile
 * Safari/Chrome, most native share sheets); clipboard fallback everywhere else, with the result
 * announced via the existing toast system (accessible: `role="status"`, matching every other
 * success/error message in the app — see `toast.tsx`) rather than only a silent visual change.
 */
export function ShareButton() {
  async function handleShare() {
    const shareData = {
      title: SITE_NAME,
      text: DEFAULT_DESCRIPTION,
      url: SITE_URL,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // AbortError fires when the user closes the native share sheet without choosing a
        // target — not a failure, nothing to announce.
        if (error instanceof Error && error.name === 'AbortError') return;
        toast.error('Không thể chia sẻ lúc này. Vui lòng thử lại.');
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(SITE_URL);
      toast.success('Đã sao chép đường liên kết.');
    } catch {
      toast.error('Không thể sao chép đường liên kết. Vui lòng thử lại.');
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleShare} aria-label={`Chia sẻ ${SITE_NAME}`}>
      <Share2 className="h-4 w-4" aria-hidden="true" />
      Chia sẻ
    </Button>
  );
}
