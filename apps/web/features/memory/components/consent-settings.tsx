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

const MODE_OPTIONS: { value: MemoryConsentModeValue; label: string }[] = [
  { value: 'ASK_EVERY_TIME', label: 'Ask me every time' },
  { value: 'ALLOW_SELECTED', label: 'Allow only what I explicitly approve' },
  { value: 'ALLOW_TYPE', label: 'Allow this type automatically' },
  { value: 'DENY_TYPE', label: "Don't remember this type" },
  { value: 'DISABLED', label: 'Turn off memory entirely' },
];

const TYPE_LABELS: { value: MemoryTypeValue; label: string }[] = [
  { value: 'IDENTITY', label: 'Identity' },
  { value: 'PREFERENCE', label: 'Preferences' },
  { value: 'GOAL', label: 'Goals' },
  { value: 'RELATIONSHIP', label: 'Relationships' },
  { value: 'HABIT', label: 'Habits' },
  { value: 'ROUTINE', label: 'Routines' },
  { value: 'ACHIEVEMENT', label: 'Achievements' },
  { value: 'CHALLENGE', label: 'Challenges' },
  { value: 'EMOTION', label: 'Emotions' },
  { value: 'IMPORTANT_EVENT', label: 'Important events' },
  { value: 'DECISION', label: 'Decisions' },
  { value: 'INTEREST', label: 'Interests' },
  { value: 'WORK', label: 'Work' },
  { value: 'STUDY', label: 'Study' },
  { value: 'PET', label: 'Pets' },
  { value: 'LOCATION_PREFERENCE', label: 'Place preferences' },
  { value: 'HEALTH', label: 'Health (requires explicit permission)' },
  { value: 'CUSTOM', label: 'Other' },
];

export function ConsentSettings() {
  const queryClient = useQueryClient();
  const [addingType, setAddingType] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['memory-consents'], queryFn: memoryApi.consents.get });

  const updateGlobal = useMutation({
    mutationFn: (mode: MemoryConsentModeValue) => memoryApi.consents.updateGlobal(mode),
    onSuccess: (updated) => {
      queryClient.setQueryData(['memory-consents'], updated);
      toast.success('Memory setting updated.');
    },
    onError: () => toast.error("Couldn't save that. Please try again."),
  });

  const updateType = useMutation({
    mutationFn: ({ type, mode }: { type: MemoryTypeValue; mode: MemoryConsentModeValue }) => memoryApi.consents.updateType(type, mode),
    onSuccess: (updated) => {
      queryClient.setQueryData(['memory-consents'], updated);
      setAddingType('');
      toast.success('Memory setting updated.');
    },
    onError: () => toast.error("Couldn't save that. Please try again."),
  });

  if (isLoading || !data) {
    return <Skeleton className="h-32 w-full" />;
  }

  const overriddenTypes = new Set(data.typeOverrides.map((o) => o.type));
  const availableTypes = TYPE_LABELS.filter((t) => !overriddenTypes.has(t.value));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <p className="text-body-sm font-semibold text-text-secondary">Global memory setting</p>
        <p className="text-body-sm text-text-secondary">
          Applies to every memory type unless you set a specific rule for that type below.
        </p>
        <Dropdown
          id="global-consent"
          label="When BeaconVie could remember something"
          value={data.globalMode}
          options={MODE_OPTIONS}
          onChange={(value) => updateGlobal.mutate(value as MemoryConsentModeValue)}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-body-sm font-semibold text-text-secondary">Per-type rules</p>
        {data.typeOverrides.length === 0 && (
          <p className="text-body-sm text-text-secondary">No specific rules yet — every type follows the global setting above.</p>
        )}
        <ul className="flex flex-col gap-2">
          {data.typeOverrides.map((override) => (
            <li key={override.type} className="flex items-center justify-between gap-3 rounded-md border border-border-subtle p-3">
              <span className="text-body-sm font-medium text-text-primary">
                {TYPE_LABELS.find((t) => t.value === override.type)?.label ?? override.type}
              </span>
              <Dropdown
                id={`type-consent-${override.type}`}
                label="Rule"
                value={override.mode}
                options={MODE_OPTIONS}
                onChange={(value) => updateType.mutate({ type: override.type, mode: value as MemoryConsentModeValue })}
                className="w-64"
              />
            </li>
          ))}
        </ul>

        {availableTypes.length > 0 && (
          <div className="flex items-end gap-2 border-t border-border-subtle pt-3">
            <Dropdown
              id="add-type-override"
              label="Add a rule for a specific type"
              value={addingType}
              options={[{ value: '', label: 'Choose a type…' }, ...availableTypes]}
              onChange={setAddingType}
              className="flex-1"
            />
            <Button
              type="button"
              disabled={!addingType}
              loading={updateType.isPending}
              onClick={() => addingType && updateType.mutate({ type: addingType as MemoryTypeValue, mode: 'ALLOW_TYPE' })}
            >
              Add
            </Button>
          </div>
        )}
      </Card>

      <p className="text-caption text-text-tertiary">
        Health memories are never remembered automatically — you must explicitly set &ldquo;Allow this type
        automatically&rdquo; for Health specifically, no matter what your global setting is.
      </p>
    </div>
  );
}
