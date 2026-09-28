import type { ListTuViChartsResultDto, TuViChartDto, TuViChartHistoryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface CalculateTuViChartInput { birthDate: string; birthTime: string; sex: 'Nam' | 'Nữ'; }

export const tuViApi = {
  calculate: (input: CalculateTuViChartInput) => api.post<TuViChartDto>('/tu-vi/calculate', input),
  listCharts: () => api.get<ListTuViChartsResultDto>('/tu-vi/charts?status=ACTIVE&page=1&pageSize=20'),
  getChart: (id: string) => api.get<TuViChartDto>(`/tu-vi/charts/${id}`),
  chartHistory: (id: string) => api.get<TuViChartHistoryDto[]>(`/tu-vi/charts/${id}/history`),
  retryInterpretation: (id: string) => api.post<TuViChartDto>(`/tu-vi/charts/${id}/interpret`),
};
