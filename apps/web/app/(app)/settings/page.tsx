'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/features/dashboard/api/preferences-api';
import { useAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
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

const MEMORY_OPTIONS: { value: MemoryPreferenceValue; label: string }[] = [
  { value: 'ASK_BEFORE_SAVING', label: 'Hỏi trước khi lưu' },
  { value: 'SAVE_SELECTED_ONLY', label: 'Chỉ lưu nội dung được chọn' },
  { value: 'DO_NOT_SAVE_YET', label: 'Chưa lưu ký ức' },
];
const SECTIONS = [['account', 'Tài khoản'], ['security', 'Bảo mật'], ['privacy', 'Ký ức và riêng tư'], ['notifications', 'Thông báo'], ['data', 'Dữ liệu và hỗ trợ']] as const;

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['preferences'], queryFn: preferencesApi.get });
  const updatePreference = useMutation({
    mutationFn: preferencesApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(['preferences'], updated);
      toast.success('Đã lưu tùy chọn.');
    },
    onError: () => toast.error('Chưa thể lưu thay đổi. Vui lòng thử lại.'),
  });
  const createExport = useMutation({
    mutationFn: () => memoryApi.export.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menhvi-memory-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống bản xuất ký ức.');
    },
    onError: () => toast.error('Chưa thể xuất ký ức. Vui lòng thử lại.'),
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 [&_.text-caution]:text-[#E5A69C] [&_button.bg-caution]:text-text-primary">
      <header>
        <p className="text-caption uppercase tracking-widest text-insight">Mệnh Vi · Cài đặt</p>
        <h1 className="mt-2 font-display text-heading-lg text-text-primary">Tài khoản của bạn</h1>
        <p className="mt-2 text-body-sm text-text-secondary">Quản lý bảo mật, quyền riêng tư và những điều bạn muốn ghi nhớ.</p>
      </header>
      <div className="grid min-w-0 gap-8 desktop:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Các mục cài đặt" className="flex flex-wrap gap-2 self-start desktop:sticky desktop:top-6 desktop:flex-col">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-md border border-border-subtle px-3 text-body-sm text-text-secondary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight">{label}</a>)}
        </nav>
        <div className="min-w-0 space-y-10">
          <section id="account" aria-labelledby="account-heading" className="scroll-mt-6 space-y-4">
            <h2 id="account-heading" className="font-display text-heading-md">Tài khoản và Premium</h2>
            <Card>
              {authLoading ? <Skeleton className="h-24 w-full" /> : user ? <dl className="space-y-3 text-body-sm">
                <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]"><dt className="text-text-secondary">Tên hiển thị</dt><dd className="break-words">{user.displayName}</dd></div>
                <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]"><dt className="text-text-secondary">Email</dt><dd className="break-all">{user.email}</dd></div>
                <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]"><dt className="text-text-secondary">Xác minh email</dt><dd>{user.emailVerifiedAt ? 'Đã xác minh' : <Link href="/verify-email/pending" className="text-insight underline">Chưa xác minh — gửi liên kết</Link>}</dd></div>
              </dl> : <p role="status">Chưa thể tải thông tin tài khoản.</p>}
              <div className="mt-5 border-t border-border-subtle pt-5"><PremiumStatusCard /></div>
            </Card>
          </section>
          <section id="security" aria-labelledby="security-heading" className="scroll-mt-6 space-y-4">
            <h2 id="security-heading" className="font-display text-heading-md">Bảo mật và thiết bị</h2>
            <ChangePasswordForm />
            <SessionsPanel />
          </section>
          <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-6 space-y-4">
            <h2 id="privacy-heading" className="font-display text-heading-md">Ký ức và quyền riêng tư</h2>
            <Card>
              <p className="mb-4 text-body-sm text-text-secondary">Tùy chọn ghi nhớ trong cuộc trò chuyện làm quen ban đầu.</p>
              {isError ? <ErrorState title="Chưa thể tải tùy chọn" onRetry={() => refetch()} /> : isLoading || !data ? <div role="status"><span className="sr-only">Đang tải tùy chọn…</span><Skeleton className="h-11 w-full" /></div> : <Dropdown id="memory-preference" label="Ghi nhớ khi làm quen" value={data.memoryPreference} options={MEMORY_OPTIONS} disabled={updatePreference.isPending} onChange={(value) => updatePreference.mutate({ memoryPreference: value as MemoryPreferenceValue })} />}
            </Card>
            <ConsentSettings />
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/memory" className="inline-flex min-h-11 items-center text-body-sm text-insight underline">Xem và quản lý ký ức</Link>
              <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>Xuất ký ức</Button>
            </div>
          </section>
          <section id="notifications" aria-labelledby="notifications-heading" className="scroll-mt-6 space-y-4">
            <h2 id="notifications-heading" className="font-display text-heading-md">Thông báo</h2>
            <NotificationPreferencesSection />
          </section>
          <section id="data" aria-labelledby="data-heading" className="scroll-mt-6 space-y-4">
            <h2 id="data-heading" className="font-display text-heading-md">Dữ liệu và hỗ trợ</h2>
            <AccountDataSection />
            <LegalLinksSection />
          </section>
        </div>
      </div>
    </div>
  );
}
