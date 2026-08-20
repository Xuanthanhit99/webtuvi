'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { settingsApi } from '../api/settings-api';
import { useInvalidateAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api-error';

/**
 * Sprint 10 — the real "Export my data" / "Delete my account" controls the Settings page's
 * "More settings" card previously described as "coming soon." See
 * docs/architecture/account-data-rights.md for what's exported/deleted/retained and why.
 */
export function AccountDataSection() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createExport = useMutation({
    mutationFn: () => settingsApi.export.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beaconvie-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Your data export has downloaded.');
    },
    onError: () => toast.error("Couldn't create an export right now. Please try again."),
  });

  const deleteAccount = useMutation({
    mutationFn: () => settingsApi.deleteAccount(password),
    onSuccess: () => {
      invalidateAuth();
      toast.success('Your account has been deleted.');
      router.push('/login');
    },
    onError: (error: unknown) => {
      setDeleteError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    },
  });

  function closeDialog() {
    setConfirmOpen(false);
    setPassword('');
    setDeleteError(null);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-body-sm font-semibold text-text-secondary">My data</p>
        <p className="text-body-sm text-text-secondary">
          Download everything Tử Vi Tarot has saved for you, or permanently delete your account.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-body-sm font-medium text-text-primary">Export my data</p>
            <p className="text-body-sm text-text-secondary">
              A single file with your account, Companion, Memory, Journal, Discovery readings, and Premium history.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>
            Export my data
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <div>
            <p className="text-body-sm font-medium text-text-primary">Delete my account</p>
            <p className="text-body-sm text-text-secondary">Permanent. Your Premium access ends immediately.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete account
          </Button>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={closeDialog}
        title="Delete your account?"
        description="This permanently deletes your Companion conversations, Memory, Journal entries, and Discovery readings (Tarot, Numerology, Natal Chart). Active sessions are revoked immediately and Premium access ends right away."
        variant="destructive"
      >
        <div className="flex items-start gap-2 rounded-md border border-caution/30 bg-caution/5 p-3 text-body-sm text-caution">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            This can’t be undone. A record of your past payments is kept for accounting purposes, but it contains no
            personal profile information once your account is deleted.
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDeleteError(null);
            deleteAccount.mutate();
          }}
          noValidate
          className="mt-4 flex flex-col gap-4"
        >
          {deleteError && <Alert variant="error">{deleteError}</Alert>}

          <FormField label="Confirm your password" htmlFor="delete-account-password">
            <PasswordInput
              id="delete-account-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleteAccount.isPending} disabled={password.length === 0}>
              Permanently delete my account
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
