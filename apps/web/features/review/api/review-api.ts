import type { ListReviewsResultDto, ReviewMarkdownExportDto, ReviewStateValue, ReviewSummaryDto, ReviewWindowValue } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListReviewsFilters {
  window?: ReviewWindowValue;
  state?: ReviewStateValue;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ReviewDetailFilters {
  category?: string;
  priorityTier?: 'LOW' | 'MEDIUM' | 'HIGH';
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reviewApi = {
  list: (filters: ListReviewsFilters = {}) => api.get<ListReviewsResultDto>(`/reviews${toQuery(filters)}`),
  current: (window: 'week' | 'month') => api.get<ReviewSummaryDto>(`/reviews/current/${window}`),
  custom: (from: string, to: string) => api.get<ReviewSummaryDto>(`/reviews/custom${toQuery({ from, to })}`),
  get: (id: string, filters: ReviewDetailFilters = {}) => api.get<ReviewSummaryDto>(`/reviews/${id}${toQuery(filters)}`),
  archive: (id: string) => api.post<ReviewSummaryDto>(`/reviews/${id}/archive`),
  exportMarkdown: (id: string) => api.get<ReviewMarkdownExportDto>(`/reviews/${id}/export/markdown`),
  exportJson: (id: string) => api.get<ReviewSummaryDto>(`/reviews/${id}/export/json`),
};
