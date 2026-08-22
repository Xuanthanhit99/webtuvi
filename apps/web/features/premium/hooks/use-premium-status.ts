import { useQuery, useQueryClient } from '@tanstack/react-query';
import { premiumApi } from '../api/premium-api';

export const PREMIUM_STATUS_QUERY_KEY = ['premium', 'status'];

export function usePremiumStatus({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: PREMIUM_STATUS_QUERY_KEY, queryFn: premiumApi.status, staleTime: 30_000, enabled });
}

export function useInvalidatePremiumStatus() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PREMIUM_STATUS_QUERY_KEY });
}
