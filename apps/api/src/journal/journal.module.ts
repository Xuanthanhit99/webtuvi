import { Module } from '@nestjs/common';
import { JournalRecordService } from './record/journal-record.service';
import { JournalRecordController } from './record/journal-record.controller';
import { JournalTimelineService } from './timeline/journal-timeline.service';
import { JournalExportService } from './export/journal-export.service';
import { JournalExportController } from './export/journal-export.controller';

/**
 * Journal Foundation (Sprint 4A) — a first-class, user-authored writing space. Deliberately not
 * the Reflection Engine: no AI-generated journal content, no automatic summarization, no mood
 * analytics, no embeddings/vector database/semantic search/RAG anywhere in this module. See
 * docs/architecture/journal-foundation.md.
 *
 * `JournalTimelineService`'s controller method lives on `JournalRecordController` itself (see
 * that controller's own comment) — a route-ordering footgun, not a layering one, so the service
 * stays a separate class for clean separation while the route is co-located with `:id` for safe
 * Express route-matching.
 */
@Module({
  controllers: [JournalRecordController, JournalExportController],
  providers: [JournalRecordService, JournalTimelineService, JournalExportService],
  exports: [JournalRecordService],
})
export class JournalModule {}
