'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReviewTimeline } from './review-timeline';
import { ReviewDetail } from './review-detail';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

/**
 * `/reviews`'s shell — quick entry points to the current Weekly/Monthly review plus the Review
 * Timeline (past reviews), and the shared `?item=<id>` "open detail in place" pattern every other
 * module in this product already uses.
 */
export function ReviewDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/reviews?item=${id}` : '/reviews', { scroll: false });
  }

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Reviews"
        title="Tuần và tháng được tổng kết bằng dữ kiện thật"
        description="Deterministic weekly and monthly summaries built from your existing insights, reflections, journal entries, and memories. Never AI-generated: every number and evidence link here traces back to something real."
      />

      {!activeId && (
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="text-body-sm font-semibold text-text-secondary">This week</p>
              <p className="text-body-sm text-text-secondary">Your weekly review, generated from this week&rsquo;s activity.</p>
            </div>
            <Link href="/reviews/week">
              <Button variant="secondary" size="sm">
                View
              </Button>
            </Link>
          </Card>
          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="text-body-sm font-semibold text-text-secondary">This month</p>
              <p className="text-body-sm text-text-secondary">Your monthly review, generated from this month&rsquo;s activity.</p>
            </div>
            <Link href="/reviews/month">
              <Button variant="secondary" size="sm">
                View
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {activeId ? <ReviewDetail id={activeId} onClose={() => selectItem(null)} /> : <ReviewTimeline onSelect={selectItem} />}
    </MvPage>
  );
}
