'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminUserLookupDto } from '@beaconvie/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { adminApi } from '../api/admin-api';
import { AdminEntitlementList } from './admin-entitlement-list';
import { AdminPaymentList } from './admin-payment-list';

/** Interim Sprint — Admin Operator Tooling. Exact-match search only (email or id) — no partial/
 * fuzzy lookup, mirroring the API's own no-enumeration design. Read-only throughout: no field on
 * this panel or its children is ever editable. */
export function AdminUserLookupPanel() {
  const [query, setQuery] = useState('');
  const [searchedKey, setSearchedKey] = useState<{ type: 'email' | 'id'; value: string } | null>(null);

  const lookup = useQuery<AdminUserLookupDto, ApiError>({
    queryKey: ['admin', 'user-lookup', searchedKey],
    queryFn: () => {
      if (!searchedKey) throw new Error('no search key');
      return searchedKey.type === 'email' ? adminApi.lookupUserByEmail(searchedKey.value) : adminApi.lookupUserById(searchedKey.value);
    },
    enabled: !!searchedKey,
    retry: false,
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchedKey({ type: trimmed.includes('@') ? 'email' : 'id', value: trimmed });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-body-lg font-medium text-text-primary">User lookup</h2>
        <p className="text-body-sm text-text-secondary">Exact match only — enter a full email address or an internal user id.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 tablet:flex-row tablet:items-end" noValidate>
        <div className="flex-1">
          <FormField label="Email or user id" htmlFor="admin-user-search">
            <Input
              id="admin-user-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="user@example.com or cku1a2b3..."
              autoComplete="off"
            />
          </FormField>
        </div>
        <Button type="submit" variant="primary" loading={lookup.isFetching}>
          Search
        </Button>
      </form>

      {lookup.isFetching && <Skeleton className="h-24 w-full" />}

      {lookup.isError && (
        <ErrorState
          title={lookup.error instanceof ApiError && lookup.error.status === 404 ? 'No user found' : 'Lookup failed'}
          description={lookup.error instanceof ApiError ? lookup.error.message : 'Something went wrong. Please try again.'}
        />
      )}

      {lookup.data && <AdminUserResult user={lookup.data} />}
    </Card>
  );
}

function AdminUserResult({ user }: { user: AdminUserLookupDto }) {
  const isDeleted = user.status === 'DELETED';
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-md font-medium text-text-primary">{user.displayName}</span>
        <Badge variant={user.status === 'ACTIVE' ? 'new' : user.status === 'SUSPENDED' ? 'high' : 'neutral'}>{user.status}</Badge>
        {user.role === 'ADMIN' && <Badge variant="insight">ADMIN</Badge>}
        {user.isPremium && <Badge variant="new">Premium</Badge>}
      </div>

      {isDeleted ? (
        <p className="text-body-sm text-text-secondary">
          Deleted — personal data scrubbed; financial records below are retained per policy. This is not recoverable.
        </p>
      ) : (
        <p className="text-body-sm text-text-secondary">{user.email}</p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">
        <dt className="text-text-tertiary">User id</dt>
        <dd className="text-text-primary">{user.id}</dd>
        <dt className="text-text-tertiary">Created</dt>
        <dd className="text-text-primary">{new Date(user.createdAt).toLocaleString()}</dd>
        <dt className="text-text-tertiary">Email verified</dt>
        <dd className="text-text-primary">{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleString() : 'Not verified'}</dd>
        <dt className="text-text-tertiary">Onboarded</dt>
        <dd className="text-text-primary">{user.onboardingCompletedAt ? new Date(user.onboardingCompletedAt).toLocaleString() : 'Not yet'}</dd>
      </dl>

      <AdminEntitlementList userId={user.id} />
      <AdminPaymentList userId={user.id} />
    </div>
  );
}
