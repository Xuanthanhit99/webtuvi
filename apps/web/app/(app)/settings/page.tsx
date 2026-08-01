'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/features/dashboard/api/preferences-api';
import { useAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { SessionsPanel } from '@/features/settings/components/sessions-panel';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import type { MemoryPreferenceValue } from '@beaconvie/types';

const MEMORY_OPTIONS: { value: MemoryPreferenceValue; label: string }[] = [
  { value: 'ASK_BEFORE_SAVING', label: 'Ask before saving' },
  { value: 'SAVE_SELECTED_ONLY', label: 'Save selected moments only' },
  { value: 'DO_NOT_SAVE_YET', label: "Don't save memories yet" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['preferences'], queryFn: preferencesApi.get });

  const updatePreference = useMutation({
    mutationFn: preferencesApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(['preferences'], updated);
      toast.success('Preference updated.');
    },
    onError: () => toast.error("Couldn't save that. Please try again."),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-heading-lg text-text-primary">Settings</h1>

      <Card>
        <p className="mb-3 text-body-sm font-semibold text-text-secondary">Account</p>
        <dl className="flex flex-col gap-2 text-body-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Display name</dt>
            <dd className="text-text-primary">{user?.displayName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Email</dt>
            <dd className="text-text-primary">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Email verified</dt>
            <dd className="text-text-primary">{user?.emailVerifiedAt ? 'Yes' : 'Not yet'}</dd>
          </div>
        </dl>
      </Card>

      <ChangePasswordForm />

      <SessionsPanel />

      <Card>
        <p className="mb-3 text-body-sm font-semibold text-text-secondary">Memory</p>
        <p className="mb-4 text-body-sm text-text-secondary">
          Control how BeaconVie decides what to remember from your conversations.
        </p>
        {isLoading || !data ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <Dropdown
            id="memory-preference"
            label="Memory preference"
            value={data.memoryPreference}
            options={MEMORY_OPTIONS}
            onChange={(value) => updatePreference.mutate({ memoryPreference: value as MemoryPreferenceValue })}
          />
        )}
      </Card>

      <Card>
        <p className="mb-2 text-body-sm font-semibold text-text-secondary">More settings</p>
        <p className="text-body-sm text-text-secondary">
          Notifications, theme, and account deletion are coming soon.
        </p>
      </Card>
    </div>
  );
}
