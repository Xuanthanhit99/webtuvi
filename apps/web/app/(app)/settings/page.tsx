'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/features/dashboard/api/preferences-api';
import { useAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { SessionsPanel } from '@/features/settings/components/sessions-panel';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { AccountDataSection } from '@/features/settings/components/account-data-section';
import { NotificationPreferencesSection } from '@/features/notifications/components/notification-preferences-section';
import { ConsentSettings } from '@/features/memory/components/consent-settings';
import { memoryApi } from '@/features/memory/api/memory-api';
import { PremiumStatusCard } from '@/features/premium/components/premium-status-card';
import { LegalLinksSection } from '@/features/settings/components/legal-links-section';
import type { MemoryPreferenceValue } from '@beaconvie/types';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

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

  const createExport = useMutation({
    mutationFn: () => memoryApi.export.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beaconvie-memory-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Your memory export has downloaded.');
    },
    onError: () => toast.error("Couldn't create an export right now. Please try again."),
  });

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Cài đặt"
        title="Không gian quản lý tài khoản"
        description="Các thiết lập ở đây ưu tiên sự rõ ràng: tài khoản, bảo mật, Premium, ký ức, thông báo và dữ liệu cá nhân."
      />

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

      <MvSection eyebrow="Gói hiện tại" title="Tử Vi Tarot+">
        <Card>
          <PremiumStatusCard />
        </Card>
      </MvSection>

      <ChangePasswordForm />

      <SessionsPanel />

      <Card>
        <p className="mb-3 text-body-sm font-semibold text-text-secondary">Onboarding memory (legacy)</p>
        <p className="mb-4 text-body-sm text-text-secondary">
          Chỉ điều khiển những ghi nhớ đầu tiên Tử Vi Tarot lưu trong onboarding.
        </p>
        {isLoading || !data ? (
          <div role="status">
            <span className="sr-only">Loading memory preference…</span>
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <Dropdown
            id="memory-preference"
            label="Onboarding memory preference"
            value={data.memoryPreference}
            options={MEMORY_OPTIONS}
            onChange={(value) => updatePreference.mutate({ memoryPreference: value as MemoryPreferenceValue })}
          />
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-body-sm font-semibold text-text-secondary">Memory</p>
            <p className="text-body-sm text-text-secondary">
              Kiểm soát những gì Tử Vi Tarot được phép ghi nhớ, duyệt nội dung đang chờ, và xem, xuất hoặc
              delete everything it has saved.
            </p>
          </div>
          <Link href="/memory">
            <Button variant="secondary" size="sm">
              View my memories
            </Button>
          </Link>
        </div>

        <ConsentSettings />

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <p className="text-body-sm text-text-secondary">
            Deleting a memory is permanent and immediate — it disappears from your Memory view, Companion, and Dashboard right
            away. A copy may briefly remain in encrypted backups until the next backup rotation, never used to restore it in the
            product.
          </p>
          <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>
            Export
          </Button>
        </div>
      </Card>

      <AccountDataSection />

      <NotificationPreferencesSection />

      <LegalLinksSection />
    </MvPage>
  );
}
