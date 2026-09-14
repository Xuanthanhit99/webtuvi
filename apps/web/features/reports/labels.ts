import type { BadgeVariant } from '@/components/ui/badge';
import type { DestinyReportFailureReasonValue, DestinyReportStatusValue } from '@beaconvie/types';

export const REPORT_STATUS_LABELS: Record<DestinyReportStatusValue, string> = {
  GENERATING: 'Đang tạo',
  READY: 'Sẵn sàng',
  FAILED: 'Chưa tạo được',
};

export const REPORT_STATUS_BADGE_VARIANT: Record<DestinyReportStatusValue, BadgeVariant> = {
  GENERATING: 'neutral',
  READY: 'insight',
  FAILED: 'high',
};

/** Honest, non-technical explanations — never the raw internal failure code shown to a user. */
export const REPORT_FAILURE_REASON_MESSAGES: Record<DestinyReportFailureReasonValue, string> = {
  PROVIDER_UNAVAILABLE: 'Dịch vụ AI đang tạm thời không khả dụng. Vui lòng thử tạo lại sau.',
  BUDGET_EXCEEDED: 'Hôm nay hệ thống đã chạm giới hạn AI. Vui lòng thử lại vào ngày mai.',
  VALIDATION_FAILED: 'Báo cáo tạo ra chưa đạt định dạng cần thiết. Vui lòng thử tạo lại.',
  SAFETY_REFUSED: 'Báo cáo này chưa thể tạo một cách an toàn. Vui lòng thử lại, hoặc liên hệ nếu lỗi tiếp diễn.',
  INTERNAL_ERROR: 'Có lỗi từ hệ thống. Vui lòng thử tạo lại.',
};
