import type { DestinyReport } from '@prisma/client';
import type { ReportSourceSnapshot, ReportStructuredResult } from './reports.types';

export interface ReportSummaryDto {
  id: string;
  status: DestinyReport['status'];
  createdAt: string;
  completedAt: string | null;
}

export interface ReportDto extends ReportSummaryDto {
  reportSchemaVersion: string;
  reportTemplateVersion: string;
  aiPromptVersion: string;
  /** Present on every report regardless of status — the calculated facts a report was built from
   * (locked "Calculated Facts appendix" section). Kept strictly separate from `result`, which is
   * AI-generated narrative (locked decision #11/#5 of the architecture doc). */
  sourceSnapshot: ReportSourceSnapshot;
  /** Null until `READY`. Never a placeholder/partial value (locked decision #14). */
  result: ReportStructuredResult | null;
  aiProvider: DestinyReport['aiProvider'];
  aiModel: string | null;
  failureReason: DestinyReport['failureReason'];
}

export function toReportSummaryDto(report: DestinyReport): ReportSummaryDto {
  return {
    id: report.id,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    completedAt: report.completedAt?.toISOString() ?? null,
  };
}

export function toReportDto(report: DestinyReport): ReportDto {
  return {
    ...toReportSummaryDto(report),
    reportSchemaVersion: report.reportSchemaVersion,
    reportTemplateVersion: report.reportTemplateVersion,
    aiPromptVersion: report.aiPromptVersion,
    sourceSnapshot: report.sourceSnapshot as unknown as ReportSourceSnapshot,
    result: (report.structuredResult as unknown as ReportStructuredResult | null) ?? null,
    aiProvider: report.aiProvider,
    aiModel: report.aiModel,
    failureReason: report.failureReason,
  };
}
