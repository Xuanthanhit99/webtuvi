import type { EasternHoroscopeProfileDto, GeocodingSearchResultDto, ListEasternHoroscopeProfilesResultDto, ListNatalChartsResultDto, ListNumerologyReadingsResultDto, NatalChartDto, NumerologyMeaningDto, NumerologyReadingDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const discoverApi = {
  searchPlaces: (q: string) => api.get<GeocodingSearchResultDto[]>(`/geocoding/search?q=${encodeURIComponent(q)}`),
  createNatalChart: (birthDate: string, birthTime: string | undefined, locationToken: string) => api.post<NatalChartDto>('/natal-charts', { birthDate, birthTime, locationToken }),
  listNatalCharts: () => api.get<ListNatalChartsResultDto>('/natal-charts?status=ACTIVE&page=1&pageSize=20'),
  getNatalChart: (id: string) => api.get<NatalChartDto>(`/natal-charts/${id}`),
  retryNatalInterpretation: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/interpret`),
  archiveNatal: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/archive`),
  restoreNatal: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/restore`),
  removeNatal: (id: string) => api.delete<NatalChartDto>(`/natal-charts/${id}`),
  calculateNumerology: (fullBirthName: string, birthDate: string) => api.post<NumerologyReadingDto>('/numerology/calculate', { fullBirthName, birthDate }),
  listNumerology: () => api.get<ListNumerologyReadingsResultDto>('/numerology/readings?status=ACTIVE&page=1&pageSize=20'),
  getNumerology: (id: string) => api.get<NumerologyReadingDto>(`/numerology/readings/${id}`),
  listNumerologyMeanings: () => api.get<NumerologyMeaningDto[]>('/numerology/meanings'),
  retryNumerologyInterpretation: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/interpret`),
  archiveNumerology: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/archive`),
  restoreNumerology: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/restore`),
  removeNumerology: (id: string) => api.delete<NumerologyReadingDto>(`/numerology/readings/${id}`),
  calculateEasternHoroscope: (birthDate: string) => api.post<EasternHoroscopeProfileDto>('/eastern-horoscope/calculate', { birthDate }),
  listEasternHoroscope: () => api.get<ListEasternHoroscopeProfilesResultDto>('/eastern-horoscope/profiles?status=ACTIVE&page=1&pageSize=20'),
  getEasternHoroscope: (id: string) => api.get<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}`),
  retryEasternInterpretation: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/interpret`),
  archiveEastern: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/archive`),
  restoreEastern: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/restore`),
  removeEastern: (id: string) => api.delete<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}`),
};
