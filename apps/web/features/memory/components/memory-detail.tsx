'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import type { MemoryDto } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { ImportanceBadge } from './importance-badge';

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Đã tạo', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', UPDATED: 'Đã cập nhật',
  ARCHIVED: 'Đã lưu trữ', RESTORED: 'Đã khôi phục', DELETED: 'Đã xóa', CONSENT_CHANGED: 'Đã thay đổi quyền đồng ý',
  VIEWED: 'Đã xem', EXPORTED: 'Đã xuất',
};

const TYPE_LABELS: Record<string, string> = {
  IDENTITY: 'Danh tính', PREFERENCE: 'Sở thích', GOAL: 'Mục tiêu', RELATIONSHIP: 'Mối quan hệ',
  HABIT: 'Thói quen', ROUTINE: 'Lịch trình', ACHIEVEMENT: 'Thành tựu', CHALLENGE: 'Thử thách',
  EMOTION: 'Cảm xúc', IMPORTANT_EVENT: 'Sự kiện quan trọng', DECISION: 'Quyết định', INTEREST: 'Mối quan tâm',
  WORK: 'Công việc', STUDY: 'Học tập', PET: 'Thú cưng', LOCATION_PREFERENCE: 'Sở thích địa điểm', HEALTH: 'Sức khỏe',
  CUSTOM: 'Khác',
};

export function MemoryDetail({ memoryId, onClose }: { memoryId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const {
    data: memory,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['memory', memoryId], queryFn: () => memoryApi.get(memoryId) });

  const { data: versions } = useQuery({
    queryKey: ['memory', memoryId, 'versions'],
    queryFn: () => memoryApi.versions(memoryId),
    enabled: showVersions,
  });

  const { data: auditTrail } = useQuery({
    queryKey: ['memory', memoryId, 'audit'],
    queryFn: () => memoryApi.auditTrail(memoryId),
    enabled: showAudit,
  });

  // refetchType: 'all' (not the default 'active') because the timeline is
  // unmounted while this detail view is open — an active-only invalidate
  // would just mark its cache stale without refetching, so closing back to
  // the timeline would remount it showing the still-cached, pre-change list
  // for a beat.
  function invalidateAfterChange(updated?: MemoryDto) {
    const result = Promise.all([
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['memories'], refetchType: 'all' }),
    ]);
    if (updated) queryClient.setQueryData(['memory', memoryId], updated);
    return result;
  }

  const updateTitle = useMutation({
    mutationFn: (title: string) => memoryApi.update(memoryId, { title }),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      setEditingTitle(null);
      toast.success('Đã cập nhật ký ức.');
    },
    onError: () => toast.error('Không thể cập nhật. Vui lòng thử lại.'),
  });

  const archive = useMutation({
    mutationFn: () => memoryApi.archive(memoryId),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      toast.success('Đã lưu trữ ký ức. Bạn có thể khôi phục bất cứ lúc nào.');
    },
    onError: () => toast.error('Không thể lưu trữ. Vui lòng thử lại.'),
  });

  const restore = useMutation({
    mutationFn: () => memoryApi.restore(memoryId),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      toast.success('Đã khôi phục ký ức.');
    },
    onError: () => toast.error('Không thể khôi phục. Vui lòng thử lại.'),
  });

  const remove = useMutation({
    mutationFn: () => memoryApi.remove(memoryId),
    onSuccess: () => {
      invalidateAfterChange();
      setConfirmDelete(false);
      toast.success('Đã xóa vĩnh viễn ký ức.');
      onClose();
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error('Không thể xóa. Vui lòng thử lại.');
    },
  });

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (isError || !memory) {
    return <ErrorState description="Không tìm thấy ký ức đó — có thể nó đã bị xóa." onRetry={onClose} />;
  }

  return (
    <Card className="flex flex-col gap-4" aria-label="Chi tiết ký ức">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="insight">{TYPE_LABELS[memory.type] ?? memory.type}</Badge>
            <ImportanceBadge score={memory.importanceScore} explanations={memory.importanceExplanations} pinned={memory.pinned} />
          </div>
          {editingTitle !== null ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTitle.trim()) updateTitle.mutate(editingTitle.trim());
              }}
            >
              <label htmlFor="memory-title-edit" className="sr-only">
                Tiêu đề ký ức
              </label>
              <input
                id="memory-title-edit"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                maxLength={200}
                className="h-9 flex-1 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
              />
              <Button type="submit" size="sm" loading={updateTitle.isPending}>
                Lưu
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingTitle(null)}>
                Hủy
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(memory.title)}
              className="mt-2 block text-left font-display text-heading-md text-text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
              aria-label={`Đổi tên ký ức: ${memory.title}`}
            >
              {memory.title}
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>

      <p className="whitespace-pre-wrap text-body-md text-text-primary">{memory.summary}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">
        <dt className="text-text-secondary">Ngày tạo</dt>
        <dd className="text-text-primary">{new Date(memory.createdAt).toLocaleString('vi-VN')}</dd>
        <dt className="text-text-secondary">Nguồn</dt>
        <dd className="text-text-primary">{memory.sourceConversationId ? 'Liên kết với một cuộc trò chuyện' : 'Không có nguồn liên kết'}</dd>
        <dt className="text-text-secondary">Trạng thái</dt>
        <dd className="text-text-primary">{memory.status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Đang lưu'}</dd>
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
        {memory.status === 'ARCHIVED' ? (
          <Button size="sm" variant="secondary" onClick={() => restore.mutate()} loading={restore.isPending}>
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
            Khôi phục
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => archive.mutate()} loading={archive.isPending}>
            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            Lưu trữ
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Xóa
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowVersions((v) => !v)}>
          {showVersions ? 'Ẩn' : 'Xem'} lịch sử phiên bản
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowAudit((v) => !v)}>
          {showAudit ? 'Ẩn' : 'Xem'} lịch sử hoạt động
        </Button>
      </div>

      {showVersions && (
        <section aria-label="Lịch sử phiên bản" className="border-t border-border-subtle pt-3">
          <h3 className="mb-2 text-body-sm font-semibold text-text-secondary">Lịch sử phiên bản</h3>
          {!versions ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <ul className="flex flex-col gap-2">
              {versions.map((v) => (
                <li key={v.version} className="text-body-sm text-text-secondary">
                  <span className="font-medium text-text-primary">v{v.version}</span> — {v.changeReason} —{' '}
                  {new Date(v.createdAt).toLocaleString('vi-VN')}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showAudit && (
        <section aria-label="Lịch sử hoạt động" className="border-t border-border-subtle pt-3">
          <h3 className="mb-2 text-body-sm font-semibold text-text-secondary">Lịch sử hoạt động</h3>
          {!auditTrail ? (
            <Skeleton className="h-10 w-full" />
          ) : auditTrail.length === 0 ? (
            <p className="text-body-sm text-text-secondary">Chưa có hoạt động nào được ghi lại.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {auditTrail.map((entry) => (
                <li key={entry.id} className="text-body-sm text-text-secondary">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action} — {new Date(entry.createdAt).toLocaleString('vi-VN')}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xóa ký ức này?"
        description="Thao tác này sẽ xóa vĩnh viễn. Không thể hoàn tác."
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Hủy
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
            Xóa
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
