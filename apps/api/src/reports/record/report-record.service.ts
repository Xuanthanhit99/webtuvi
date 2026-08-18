import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportGenerationService } from '../generation/report-generation.service';
import { toReportDto, toReportSummaryDto, type ReportDto, type ReportSummaryDto } from '../reports.mappers';

export interface ListReportsParams {
  page?: number;
  pageSize?: number;
}

export interface ListReportsResult {
  items: ReportSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * Owner-scoped read/lifecycle operations for Personal Destiny Reports (locked decision #16:
 * persisted, owner-scoped history; regeneration creates a new row, never overwrites). Generation
 * itself lives in `ReportGenerationService` — this service never calls the AI provider directly.
 */
@Injectable()
export class ReportRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: ReportGenerationService,
  ) {}

  async generate(userId: string): Promise<ReportDto> {
    return this.generation.generate(userId);
  }

  /** Regeneration is generation again, from a fresh snapshot (locked decision #22) — this method
   * exists as a distinct, named entry point for clarity at the controller/API layer, not because
   * its behavior differs from `generate()`. */
  async regenerate(userId: string): Promise<ReportDto> {
    return this.generation.generate(userId);
  }

  async list(userId: string, params: ListReportsParams): Promise<ListReportsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const where = { userId };
    const [total, rows] = await Promise.all([
      this.prisma.destinyReport.count({ where }),
      this.prisma.destinyReport.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    ]);

    return { items: rows.map(toReportSummaryDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<ReportDto> {
    const report = await this.findOwned(userId, id);
    return toReportDto(report);
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else"
   * (mirrors NumerologyRecordService/TarotRecordService's own `findOwned` exactly). */
  private async findOwned(userId: string, id: string) {
    const report = await this.prisma.destinyReport.findUnique({ where: { id } });
    if (!report || report.userId !== userId) {
      throw new NotFoundException({ code: 'DESTINY_REPORT_NOT_FOUND', message: 'That report was not found.' });
    }
    return report;
  }
}
