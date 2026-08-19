import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { toAdminUserLookupDto } from '../admin.mappers';
import type { AdminUserLookupDto } from '../admin.types';
import type { AdminUserLookupQueryDto } from '../dto/admin-user-lookup-query.dto';

/**
 * Interim Sprint — Admin Operator Tooling. Exact-match lookup only — no partial/fuzzy search, no
 * unrestricted list. `select` explicitly excludes `passwordHash` and every relation; there is no
 * code path in this file that can return session/token/Memory/Journal/AI-content fields, because
 * none of them are ever selected in the first place (`toAdminUserLookupDto` also never spreads).
 */
@Injectable()
export class AdminUserLookupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async lookup(query: AdminUserLookupQueryDto): Promise<AdminUserLookupDto> {
    if (!query.email && !query.id) {
      throw new BadRequestException({ code: 'ADMIN_LOOKUP_KEY_REQUIRED', message: 'Provide exactly one of email or id.' });
    }
    if (query.email && query.id) {
      throw new BadRequestException({ code: 'ADMIN_LOOKUP_KEY_REQUIRED', message: 'Provide exactly one of email or id, not both.' });
    }

    const user = query.email
      ? await this.prisma.user.findUnique({ where: { email: query.email } })
      : await this.prisma.user.findUnique({ where: { id: query.id } });

    if (!user) {
      throw new NotFoundException({ code: 'ADMIN_USER_NOT_FOUND', message: 'No user found for that lookup key.' });
    }

    const isPremium = await this.entitlementService.hasPremiumAccess(user.id);
    return toAdminUserLookupDto(user, isPremium);
  }

  /** Shared existence check for the `:id`-scoped lookups (entitlement, payments) — a plain 404,
   * never distinguishing "exists but hidden" from "doesn't exist" (this is admin-only tooling, so
   * that distinction matters less than for user-facing IDOR surfaces, but the discipline costs
   * nothing to keep — mirrors `EasternHoroscopeRecordService.findOwned()`'s identical-404 pattern). */
  async assertUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException({ code: 'ADMIN_USER_NOT_FOUND', message: 'No user found for that id.' });
    }
  }
}
