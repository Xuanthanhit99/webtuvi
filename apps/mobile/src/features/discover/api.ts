import type { EasternHoroscopeProfileDto, NumerologyReadingDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const discoverApi = {
  calculateNumerology: (fullBirthName: string, birthDate: string) =>
    api.post<NumerologyReadingDto>('/numerology/calculate', { fullBirthName, birthDate }),
  calculateEasternHoroscope: (birthDate: string) =>
    api.post<EasternHoroscopeProfileDto>('/eastern-horoscope/calculate', { birthDate }),
};
