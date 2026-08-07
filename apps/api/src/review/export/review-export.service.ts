import { Injectable, Logger } from '@nestjs/common';
import { ReviewRecordService } from '../record/review-record.service';
import { toReviewSummaryDto, type ReviewSummaryDto } from '../review.mappers';

export interface ReviewMarkdownExport {
  filename: string;
  content: string;
}

const WINDOW_LABELS: Record<ReviewSummaryDto['window'], string> = { WEEK: 'Weekly', MONTH: 'Monthly', CUSTOM: 'Custom' };

/**
 * Phase 7 — Export. Markdown and JSON only. **No PDF**: confirmed during this sprint's own audit
 * (again) that no PDF library exists anywhere in this repository — `journal-foundation.md`'s own
 * "Export" section already disclosed this for Sprint 4A's export surface. Adding one now would be
 * new infrastructure for a single format, not a deterministic-review concern; disclosed as out of
 * scope rather than silently dropped. Mirrors `JournalExportService`'s own "owner-scoped, no job-id
 * indirection needed for one document" shape.
 */
@Injectable()
export class ReviewExportService {
  private readonly logger = new Logger('ReviewExport');

  constructor(private readonly records: ReviewRecordService) {}

  async exportAsMarkdown(userId: string, id: string): Promise<ReviewMarkdownExport> {
    const review = toReviewSummaryDto(await this.records.findOwnedRaw(userId, id));
    const windowLabel = WINDOW_LABELS[review.window];
    const lines: string[] = [
      `# ${windowLabel} Review`,
      '',
      `**Period:** ${formatDate(review.windowStart)} – ${formatDate(review.windowEnd)}`,
      `**Status:** ${review.state}`,
      '',
      '## Overview',
      '',
      review.overview,
      '',
      '## Statistics',
      '',
      `- Journal entries: ${review.statistics.journalCount}`,
      `- Memories saved: ${review.statistics.memoryCreatedCount}`,
      `- Reflections: ${review.statistics.reflectionCount}`,
      `- Insights: ${review.statistics.insightCount}`,
      `- Activity events: ${review.statistics.activityCount}`,
      `- Journaling streak: ${review.statistics.journalingStreakDays} day${review.statistics.journalingStreakDays === 1 ? '' : 's'}`,
      `- Companion conversations: ${review.statistics.companionConversationCount}`,
      '',
    ];

    for (const section of review.sections) {
      lines.push(`## ${section.title}`, '', section.summary, '');
      for (const item of section.evidence) {
        lines.push(`- ${item.contribution}`);
      }
      lines.push('');
    }

    this.logger.log(`Review exported id=${id} format=markdown`);
    return { filename: `${slugify(`${windowLabel}-review-${review.windowStart.slice(0, 10)}`)}.md`, content: lines.join('\n') };
  }

  async exportAsJson(userId: string, id: string): Promise<ReviewSummaryDto> {
    const review = toReviewSummaryDto(await this.records.findOwnedRaw(userId, id));
    this.logger.log(`Review exported id=${id} format=json`);
    return review;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug.slice(0, 80) : 'review';
}
