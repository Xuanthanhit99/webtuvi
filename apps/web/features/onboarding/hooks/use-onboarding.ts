import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '../api/onboarding-api';

const ONBOARDING_KEY = ['onboarding'];

export function useOnboardingState() {
  return useQuery({ queryKey: ONBOARDING_KEY, queryFn: onboardingApi.getState });
}

export function useSendOnboardingMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.sendMessage,
    onSuccess: (data) => queryClient.setQueryData(ONBOARDING_KEY, data),
  });
}

export function useMemoryConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.respondToMemoryConsent,
    onSuccess: (data) => queryClient.setQueryData(ONBOARDING_KEY, data),
  });
}

export function useSelectDiscovery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardingApi.selectDiscovery,
    onSuccess: (data) => queryClient.setQueryData(ONBOARDING_KEY, data),
  });
}

export function useCompleteOnboarding() {
  return useMutation({ mutationFn: onboardingApi.complete });
}

export function useSkipOnboarding() {
  return useMutation({ mutationFn: onboardingApi.skip });
}
