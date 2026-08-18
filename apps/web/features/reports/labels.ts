import type { BadgeVariant } from '@/components/ui/badge';
import type { DestinyReportFailureReasonValue, DestinyReportStatusValue } from '@beaconvie/types';

export const REPORT_STATUS_LABELS: Record<DestinyReportStatusValue, string> = {
  GENERATING: 'Generating',
  READY: 'Ready',
  FAILED: 'Couldn’t generate',
};

export const REPORT_STATUS_BADGE_VARIANT: Record<DestinyReportStatusValue, BadgeVariant> = {
  GENERATING: 'neutral',
  READY: 'insight',
  FAILED: 'high',
};

/** Honest, non-technical explanations — never the raw internal failure code shown to a user. */
export const REPORT_FAILURE_REASON_MESSAGES: Record<DestinyReportFailureReasonValue, string> = {
  PROVIDER_UNAVAILABLE: 'The AI service was temporarily unavailable. Please try generating again.',
  BUDGET_EXCEEDED: 'We’ve hit today’s AI usage limit. Please try again tomorrow.',
  VALIDATION_FAILED: 'The generated report didn’t come out right. Please try generating again.',
  SAFETY_REFUSED: 'This report couldn’t be generated safely. Please try again, or reach out if this keeps happening.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try generating again.',
};
