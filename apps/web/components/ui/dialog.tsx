'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

/**
 * Uses the native <dialog> element: browsers already provide focus trapping,
 * top-layer stacking, and Escape-to-close for free — the surest way to satisfy
 * the "focus trap in dialogs" accessibility requirement without hand-rolling it.
 *
 * Accessibility + Product Polish (2026-08-19): title/description ids were previously hardcoded
 * (`"dialog-title"`), which collides via `aria-labelledby` resolving to the first matching id in
 * the document whenever 2+ Dialogs are mounted on the same page (confirmed: Settings mounts 3).
 * `useId()` gives every instance its own ids automatically — no call site needs to pass one.
 */
export function Dialog({ open, onClose, title, description, children, variant = 'default' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (variant === 'destructive') e.preventDefault();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="max-w-md rounded-xl border border-border-subtle bg-surface-raised p-6 text-text-primary shadow-sm backdrop:bg-canvas/70"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-heading-md font-display">
          {title}
        </h2>
        <IconButton aria-label="Close dialog" onClick={onClose}>
          <X className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
      {description && (
        <p id={descriptionId} className="mb-4 text-body-sm text-text-secondary">
          {description}
        </p>
      )}
      {open && children}
    </dialog>
  );
}
