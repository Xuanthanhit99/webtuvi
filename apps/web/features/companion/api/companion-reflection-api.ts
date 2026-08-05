import type { ReflectionHintDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const companionReflectionApi = {
  hint: () => api.get<ReflectionHintDto>('/companion/reflection-hint'),
};
