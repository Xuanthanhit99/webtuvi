'use client';

import { useState } from 'react';
import type { MemoryConsentModeValue, MemoryTypeValue } from '@beaconvie/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';

const MODE_OPTIONS: { value: MemoryConsentModeValue; label: string }[] = [
  { value: 'ASK_EVERY_TIME', label: 'Hỏi tôi mỗi lần' },
  { value: 'ALLOW_SELECTED', label: 'Chỉ lưu nội dung tôi chủ động đồng ý' },
  { value: 'ALLOW_TYPE', label: 'Cho phép tự động lưu' },
  { value: 'DENY_TYPE', label: "Không ghi nhớ loại này" },
  { value: 'DISABLED', label: 'Tắt ghi nhớ' },
];

const TYPE_LABELS: { value: MemoryTypeValue; label: string }[] = [
  { value: 'IDENTITY', label: 'Thông tin cá nhân' },
  { value: 'PREFERENCE', label: 'Sở thích' },
  { value: 'GOAL', label: 'Mục tiêu' },
  { value: 'RELATIONSHIP', label: 'Mối quan hệ' },
  { value: 'HABIT', label: 'Thói quen' },
  { value: 'ROUTINE', label: 'Nếp sinh hoạt' },
  { value: 'ACHIEVEMENT', label: 'Thành tựu' },
  { value: 'CHALLENGE', label: 'Thử thách' },
  { value: 'EMOTION', label: 'Cảm xúc' },
  { value: 'IMPORTANT_EVENT', label: 'Sự kiện quan trọng' },
  { value: 'DECISION', label: 'Quyết định' },
  { value: 'INTEREST', label: 'Mối quan tâm' },
  { value: 'WORK', label: 'Công việc' },
  { value: 'STUDY', label: 'Học tập' },
  { value: 'PET', label: 'Thú cưng' },
  { value: 'LOCATION_PREFERENCE', label: 'Địa điểm yêu thích' },
  { value: 'HEALTH', label: 'Sức khỏe (cần đồng ý riêng)' },
  { value: 'CUSTOM', label: 'Khác' },
];

export function ConsentSettings() {
  const queryClient = useQueryClient();
  const [addingType, setAddingType] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['memory-consents'], queryFn: memoryApi.consents.get });

  const updateGlobal = useMutation({
    mutationFn: (mode: MemoryConsentModeValue) => memoryApi.consents.updateGlobal(mode),
    onSuccess: (updated) => {
      queryClient.setQueryData(['memory-consents'], updated);
      toast.success('Đã lưu quy tắc ghi nhớ.');
    },
    onError: () => toast.error('Chưa thể lưu thay đổi. Vui lòng thử lại.'),
  });

  const updateType = useMutation({
    mutationFn: ({ type, mode }: { type: MemoryTypeValue; mode: MemoryConsentModeValue }) => memoryApi.consents.updateType(type, mode),
    onSuccess: (updated) => {
      queryClient.setQueryData(['memory-consents'], updated);
      setAddingType('');
      toast.success('Đã lưu quy tắc ghi nhớ.');
    },
    onError: () => toast.error('Chưa thể lưu thay đổi. Vui lòng thử lại.'),
  });

  if (isError) return <ErrorState title="Chưa thể tải quy tắc ghi nhớ" onRetry={() => refetch()} />;
  if (isLoading || !data) {
    return <Skeleton className="h-32 w-full" />;
  }

  const overriddenTypes = new Set(data.typeOverrides.map((o) => o.type));
  const availableTypes = TYPE_LABELS.filter((t) => !overriddenTypes.has(t.value));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <p className="text-body-sm font-semibold text-text-secondary">Quy tắc ghi nhớ chung</p>
        <p className="text-body-sm text-text-secondary">
          Áp dụng cho mọi loại ký ức, trừ khi bạn đặt quy tắc riêng bên dưới.
        </p>
        <Dropdown
          id="global-consent"
          label="Khi Mệnh Vi muốn ghi nhớ thông tin"
          value={data.globalMode}
          options={MODE_OPTIONS}
          disabled={updateGlobal.isPending}
          onChange={(value) => updateGlobal.mutate(value as MemoryConsentModeValue)}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-body-sm font-semibold text-text-secondary">Quy tắc theo loại thông tin</p>
        {data.typeOverrides.length === 0 && (
          <p className="text-body-sm text-text-secondary">Chưa có quy tắc riêng. Mọi loại thông tin dùng quy tắc chung ở trên.</p>
        )}
        <ul className="flex flex-col gap-2">
          {data.typeOverrides.map((override) => (
            <li key={override.type} className="flex flex-col gap-3 rounded-md border border-border-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-body-sm font-medium text-text-primary">
                {TYPE_LABELS.find((t) => t.value === override.type)?.label ?? override.type}
              </span>
              <Dropdown
                id={`type-consent-${override.type}`}
                label="Quy tắc"
                value={override.mode}
                options={MODE_OPTIONS}
                disabled={updateType.isPending}
                onChange={(value) => updateType.mutate({ type: override.type, mode: value as MemoryConsentModeValue })}
                className="w-full sm:w-64"
              />
            </li>
          ))}
        </ul>

        {availableTypes.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 sm:flex-row sm:items-end">
            <Dropdown
              id="add-type-override"
              label="Thêm quy tắc cho loại thông tin"
              value={addingType}
              options={[{ value: '', label: 'Chọn loại thông tin…' }, ...availableTypes]}
              onChange={setAddingType}
              className="flex-1"
            />
            <Button
              type="button"
              disabled={!addingType}
              loading={updateType.isPending}
              onClick={() => addingType && updateType.mutate({ type: addingType as MemoryTypeValue, mode: 'ALLOW_TYPE' })}
            >
              Thêm quy tắc
            </Button>
          </div>
        )}
      </Card>

      <p className="text-caption text-text-secondary">
        Thông tin sức khỏe chỉ được tự động ghi nhớ khi bạn cho phép riêng cho loại Sức khỏe, bất kể quy tắc chung.
      </p>
    </div>
  );
}
