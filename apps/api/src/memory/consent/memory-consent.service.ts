import { Injectable } from '@nestjs/common';
import type { MemoryConsentMode, MemoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryAuditService } from '../audit/memory-audit.service';

export interface MemoryConsentSummaryDto {
  globalMode: MemoryConsentMode;
  typeOverrides: { type: MemoryType; mode: MemoryConsentMode }[];
}

export interface ConsentDecision {
  allowed: boolean;
  mode: MemoryConsentMode;
  reason?: 'disabled' | 'deny_type' | 'health_requires_explicit_consent';
}

const CONSERVATIVE_DEFAULT: MemoryConsentMode = 'ASK_EVERY_TIME';

/**
 * The single source of truth for memory consent (Sprint 3A audit brief
 * §"Settings integration" — Settings reads/writes through this service only,
 * never a parallel toggle). Distinct from the older, Sprint 1
 * `UserPreference.memoryPreference` field, which governs only the legacy
 * onboarding→MemoryNote flow and is left untouched — see
 * docs/architecture/memory-engine.md "Relationship to Sprint 1's MemoryNote".
 *
 * Two tables back this, deliberately: `MemoryConsentSetting` (one row per
 * user — the global default, defaulting to the conservative `ASK_EVERY_TIME`)
 * and `MemoryTypeConsent` (zero-or-one row per (user, type) — an explicit
 * override). Absence of an override row means "use the global default";
 * no `MemoryType` is ever auto-allowed just because a row doesn't exist yet.
 */
@Injectable()
export class MemoryConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: MemoryAuditService,
  ) {}

  async getSummary(userId: string): Promise<MemoryConsentSummaryDto> {
    const [setting, overrides] = await Promise.all([
      this.getOrCreateGlobal(userId),
      this.prisma.memoryTypeConsent.findMany({ where: { userId } }),
    ]);
    return {
      globalMode: setting.mode,
      typeOverrides: overrides.map((o) => ({ type: o.type, mode: o.mode })),
    };
  }

  async updateGlobal(userId: string, mode: MemoryConsentMode, requestId?: string): Promise<MemoryConsentSummaryDto> {
    await this.prisma.memoryConsentSetting.upsert({
      where: { userId },
      create: { userId, mode },
      update: { mode },
    });
    await this.audit.record({ userId, action: 'CONSENT_CHANGED', requestId, metadata: { scope: 'global', mode } });
    return this.getSummary(userId);
  }

  /**
   * `HEALTH` may only ever be set via an explicit `ALLOW_TYPE` call here —
   * there is no separate "special-case" API, the enforcement lives entirely
   * in `resolve()`/`canAccept()` below, which never lets HEALTH fall back to
   * the global default the way every other type does.
   */
  async updateType(userId: string, type: MemoryType, mode: MemoryConsentMode, requestId?: string): Promise<MemoryConsentSummaryDto> {
    await this.prisma.memoryTypeConsent.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, mode },
      update: { mode },
    });
    await this.audit.record({ userId, action: 'CONSENT_CHANGED', requestId, metadata: { scope: 'type', type, mode } });
    return this.getSummary(userId);
  }

  /** Resolves the effective mode for a type — override if set, else the global default. Never used directly for HEALTH gating; see `canAccept`. */
  async resolveMode(userId: string, type: MemoryType): Promise<MemoryConsentMode> {
    const override = await this.prisma.memoryTypeConsent.findUnique({ where: { userId_type: { userId, type } } });
    if (override) return override.mode;
    const global = await this.getOrCreateGlobal(userId);
    return global.mode;
  }

  /**
   * The single gate every candidate acceptance (and, defensively, candidate
   * creation) must pass through. `HEALTH` never falls back to the global
   * default — it requires its own explicit `ALLOW_TYPE` override, full stop.
   */
  async canAccept(userId: string, type: MemoryType): Promise<ConsentDecision> {
    if (type === 'HEALTH') {
      const override = await this.prisma.memoryTypeConsent.findUnique({ where: { userId_type: { userId, type } } });
      if (!override || override.mode !== 'ALLOW_TYPE') {
        return { allowed: false, mode: override?.mode ?? CONSERVATIVE_DEFAULT, reason: 'health_requires_explicit_consent' };
      }
      return { allowed: true, mode: 'ALLOW_TYPE' };
    }

    const mode = await this.resolveMode(userId, type);
    if (mode === 'DISABLED') return { allowed: false, mode, reason: 'disabled' };
    if (mode === 'DENY_TYPE') return { allowed: false, mode, reason: 'deny_type' };
    return { allowed: true, mode };
  }

  private async getOrCreateGlobal(userId: string) {
    const existing = await this.prisma.memoryConsentSetting.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.memoryConsentSetting.upsert({
      where: { userId },
      create: { userId, mode: CONSERVATIVE_DEFAULT },
      update: {},
    });
  }
}
