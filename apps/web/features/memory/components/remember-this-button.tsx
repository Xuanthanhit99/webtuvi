'use client';

import { useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemoryTypeValue } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Dialog } from '@/components/ui/dialog';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { toast } from '@/components/ui/toast';

const TYPE_OPTIONS: { value: MemoryTypeValue; label: string }[] = [
  { value: 'GOAL', label: 'Mục tiêu' },
  { value: 'IDENTITY', label: 'Danh tính' },
  { value: 'PREFERENCE', label: 'Sở thích' },
  { value: 'RELATIONSHIP', label: 'Mối quan hệ' },
  { value: 'HABIT', label: 'Thói quen' },
  { value: 'ROUTINE', label: 'Lịch trình' },
  { value: 'ACHIEVEMENT', label: 'Thành tựu' },
  { value: 'CHALLENGE', label: 'Thử thách' },
  { value: 'EMOTION', label: 'Cảm xúc' },
  { value: 'IMPORTANT_EVENT', label: 'Sự kiện quan trọng' },
  { value: 'DECISION', label: 'Quyết định' },
  { value: 'INTEREST', label: 'Mối quan tâm' },
  { value: 'WORK', label: 'Công việc' },
  { value: 'STUDY', label: 'Học tập' },
  { value: 'PET', label: 'Thú cưng' },
  { value: 'LOCATION_PREFERENCE', label: 'Sở thích địa điểm' },
  { value: 'HEALTH', label: 'Sức khỏe' },
  { value: 'CUSTOM', label: 'Khác' },
];

export interface RememberThisButtonProps {
  conversationId: string;
  messageId: string;
  content: string;
  /** ISO timestamp of the message this button belongs to — used only to give each button in a
   * conversation with multiple user messages a distinguishable accessible name (see below).
   * Already visible elsewhere in the UI; never a substitute for the message content itself. */
  createdAt: string;
}

/**
 * The one and only way Companion-side content can become a memory candidate
 * in Sprint 3A — an explicit user action on their own message. Never
 * automatic, never from an assistant reply (the backend independently
 * enforces this — see MemoryCandidateService.propose). Proposing and
 * accepting happen as one user-facing step ("Remember this"); if consent
 * currently blocks it, the memory lands in Settings → Memory → Pending
 * instead of silently failing.
 */
export function RememberThisButton({ conversationId, messageId, content, createdAt }: RememberThisButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MemoryTypeValue>('GOAL');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState(content);

  const remember = useMutation({
    mutationFn: async () => {
      const candidate = await memoryApi.candidates.propose({
        proposedType: type,
        proposedTitle: title.trim() || content.slice(0, 60),
        proposedSummary: summary.trim(),
        sourceConversationId: conversationId,
        sourceMessageId: messageId,
        reason: 'Được ghi nhớ từ một cuộc trò chuyện với Người bạn đồng hành.',
      });
      if (candidate.status === 'PENDING_CONSENT') {
        return { pending: true };
      }
      await memoryApi.candidates.accept(candidate.id);
      return { pending: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['memory-candidates'] });
      setOpen(false);
      toast.success(
        result.pending
          ? 'Cài đặt ký ức của bạn hiện đang chặn điều này — nó đang chờ tại Cài đặt → Ký ức → Đang chờ.'
          : 'Đã ghi nhớ.',
      );
    },
    onError: () => toast.error('Không thể ghi nhớ điều đó lúc này. Vui lòng thử lại.'),
  });

  // Accessibility + Product Polish (2026-08-19): every "Remember this" button in a conversation
  // previously shared the exact same accessible name, making them indistinguishable to a
  // screen-reader user browsing a long conversation via an elements/buttons list. Disambiguated
  // with the message's own timestamp — already visible elsewhere in the conversation UI, never the
  // message content or any AI text (which the locked decision explicitly forbids putting here).
  const formattedTime = new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <>
      <IconButton aria-label={`Ghi nhớ tin nhắn này lúc ${formattedTime}`} onClick={() => setOpen(true)}>
        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} title="Ghi nhớ điều này?" description="Mệnh Vi sẽ lưu điều này thành một ký ức mà bạn có thể xem, đổi tên, hoặc xóa bất cứ lúc nào.">
        <div className="flex flex-col gap-3">
          <Dropdown id="remember-type" label="Đây là loại ký ức gì?" value={type} options={TYPE_OPTIONS} onChange={(v) => setType(v as MemoryTypeValue)} />
          <div>
            <label htmlFor="remember-title" className="mb-2 block text-body-sm font-medium text-text-primary">
              Tiêu đề
            </label>
            <input
              id="remember-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={content.slice(0, 60)}
              maxLength={200}
              className="h-11 w-full rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
            />
          </div>
          <div>
            <label htmlFor="remember-summary" className="mb-2 block text-body-sm font-medium text-text-primary">
              What should Mệnh Vi remember?
            </label>
            <textarea
              id="remember-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full resize-y rounded-md border border-border-subtle bg-surface px-3 py-2 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button loading={remember.isPending} disabled={!summary.trim()} onClick={() => remember.mutate()}>
              Ghi nhớ điều này
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
