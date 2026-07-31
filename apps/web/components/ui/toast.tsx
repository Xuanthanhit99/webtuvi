'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'error';
}

interface ToastStore {
  toasts: ToastItem[];
  push: (message: string, variant: ToastItem['variant']) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant) =>
    set((state) => ({ toasts: [...state.toasts, { id: crypto.randomUUID(), message, variant }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 4000);
    return () => clearTimeout(timer);
  }, [item.id, dismiss]);

  const Icon = item.variant === 'success' ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-4 py-3 text-body-sm shadow-sm',
        item.variant === 'success' ? 'border-trust/40 bg-surface-raised text-trust' : 'border-caution/40 bg-surface-raised text-caution',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-text-primary">{item.message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(item.id)}
        className="ml-2 text-text-secondary hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-toast flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
