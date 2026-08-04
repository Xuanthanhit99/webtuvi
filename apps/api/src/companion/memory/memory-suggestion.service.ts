import { Injectable, Logger } from '@nestjs/common';
import type { MemoryType } from '@prisma/client';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import { MemoryAuditService } from '../../memory/audit/memory-audit.service';
import { detectSuggestion } from './memory-suggestion-detector';

export interface MemorySuggestionDto {
  type: MemoryType;
  title: string;
  summary: string;
  reason: string;
}

/**
 * Wraps the deterministic detector with a consent check: a type the user has already set to
 * `DENY_TYPE`/`DISABLED` is never suggested again — respecting "Never remember this type"
 * (Phase 4's own button) means the Companion stops *offering*, not just stops saving. Never
 * saves anything itself — see `memory-suggestion-detector.ts` and
 * docs/architecture/companion-memory-integration.md "Memory suggestions".
 */
@Injectable()
export class MemorySuggestionService {
  private readonly logger = new Logger('MemorySuggestion');

  constructor(
    private readonly consent: MemoryConsentService,
    private readonly audit: MemoryAuditService,
  ) {}

  async evaluate(userId: string, messageContent: string): Promise<MemorySuggestionDto | null> {
    const detected = detectSuggestion(messageContent);
    if (!detected) return null;

    const mode = await this.consent.resolveMode(userId, detected.type);
    if (mode === 'DENY_TYPE' || mode === 'DISABLED') {
      return null;
    }

    this.logger.log(`Suggestion generated: type=${detected.type}`);
    return { type: detected.type, title: detected.title, summary: detected.summary, reason: detected.reason };
  }

  /** "Not now" — tracked for observability (Phase 11's "dismissed suggestions") without ever
   * having created a candidate row in the first place ("never save automatically" holds even
   * for the tracking of a decline). Reuses the existing `REJECTED` audit action rather than
   * adding a new one — `memoryId` is `null` since no `Memory`/`MemoryCandidate` ever existed. */
  async dismiss(userId: string, type: MemoryType): Promise<void> {
    await this.audit.record({ userId, action: 'REJECTED', metadata: { source: 'suggestion_dismissed', type } });
    this.logger.log(`Suggestion dismissed: type=${type}`);
  }
}
