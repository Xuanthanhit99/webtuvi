import type { OnboardingStateDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const onboardingApi = {
  getState: () => api.get<OnboardingStateDto>('/onboarding'),
  sendMessage: (content: string) => api.post<OnboardingStateDto>('/onboarding/message', { content }),
  respondToMemoryConsent: (accepted: boolean) =>
    api.post<OnboardingStateDto>('/onboarding/memory/consent', { accepted }),
  selectDiscovery: (choice: 'accepted' | 'skipped') =>
    api.post<OnboardingStateDto>('/onboarding/discovery/select', { choice }),
  complete: () => api.post<{ message: string }>('/onboarding/complete'),
  skip: () => api.post<{ message: string }>('/onboarding/skip'),
};
