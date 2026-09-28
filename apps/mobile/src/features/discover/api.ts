import type { EasternHoroscopeProfileDto, GeocodingSearchResultDto, ListEasternHoroscopeProfilesResultDto, ListNatalChartsResultDto, ListNumerologyReadingsResultDto, NatalChartDto, NumerologyReadingDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const discoverApi = {
  searchPlaces: (q: string) => api.get<GeocodingSearchResultDto[]>(`/geocoding/search?q=${encodeURIComponent(q)}`),
  createNatalChart: (birthDate: string, birthTime: string | undefined, locationToken: string) => api.post<NatalChartDto>('/natal-charts', { birthDate, birthTime, locationToken }),
  listNatalCharts: () => api.get<ListNatalChartsResultDto>('/natal-charts?status=ACTIVE&page=1&pageSize=20'),
  getNatalChart: (id: string) => api.get<NatalChartDto>(`/natal-charts/${id}`),
  calculateNumerology: (fullBirthName: string, birthDate: string) => api.post<NumerologyReadingDto>('/numerology/calculate', { fullBirthName, birthDate }),
  listNumerology: () => api.get<ListNumerologyReadingsResultDto>('/numerology/readings?status=ACTIVE&page=1&pageSize=20'),
  getNumerology: (id: string) => api.get<NumerologyReadingDto>(`/numerology/readings/${id}`),
  calculateEasternHoroscope: (birthDate: string) => api.post<EasternHoroscopeProfileDto>('/eastern-horoscope/calculate', { birthDate }),
  listEasternHoroscope: () => api.get<ListEasternHoroscopeProfilesResultDto>('/eastern-horoscope/profiles?status=ACTIVE&page=1&pageSize=20'),
  getEasternHoroscope: (id: string) => api.get<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}`),
};
