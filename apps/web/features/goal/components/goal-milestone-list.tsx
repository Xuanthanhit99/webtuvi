'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GoalMilestoneDto, GoalMilestoneTypeValue } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/toast';
import { goalApi } from '../api/goal-api';
import { MILESTONE_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '../labels';

const TYPE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automatic (by evidence count)' },
];

/** Phase 5 — Milestones. AUTOMATIC milestones show no Complete/Fail controls at all (only
 * `GoalProgressEngineService`'s own recompute can complete one) — the UI structurally can't offer
 * an action the backend would reject. */
export function GoalMilestoneList({ goalId, milestones }: { goalId: string; milestones: GoalMilestoneDto[] }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalMilestoneTypeValue>('MANUAL');
  const [targetCount, setTargetCount] = useState('');

  const create = useMutation({
    mutationFn: () => goalApi.createMilestone(goalId, { title, type, targetCount: type === 'AUTOMATIC' ? Number(targetCount) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', goalId] });
      setTitle('');
      setTargetCount('');
      setShowForm(false);
      toast.success('Milestone added.');
    },
    onError: () => toast.error("Couldn't add that milestone. Please try again."),
  });

  const complete = useMutation({
    mutationFn: (milestoneId: string) => goalApi.completeMilestone(goalId, milestoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', goalId] }),
    onError: () => toast.error("Couldn't complete that milestone. Please try again."),
  });

  const fail = useMutation({
    mutationFn: (milestoneId: string) => goalApi.failMilestone(goalId, milestoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', goalId] }),
    onError: () => toast.error("Couldn't update that milestone. Please try again."),
  });

  return (
    <div className="flex flex-col gap-3">
      {milestones.length === 0 ? (
        <p className="text-body-sm text-text-secondary">No milestones yet.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Milestones">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2">
              <div>
                <p className="text-body-sm font-semibold text-text-primary">{milestone.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="neutral">{MILESTONE_TYPE_LABELS[milestone.type]}</Badge>
                  <Badge variant="neutral">{MILESTONE_STATUS_LABELS[milestone.status]}</Badge>
                  {milestone.targetCount !== null && <span className="text-caption text-text-disabled">Target: {milestone.targetCount}</span>}
                </div>
              </div>
              {milestone.type === 'MANUAL' && milestone.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => complete.mutate(milestone.id)} loading={complete.isPending}>
                    Complete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => fail.mutate(milestone.id)} loading={fail.isPending}>
                    Fail
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <FormField label="Title" htmlFor="milestone-title" required>
            <Input id="milestone-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <Dropdown id="milestone-type" label="Type" value={type} options={TYPE_OPTIONS} onChange={(v) => setType(v as GoalMilestoneTypeValue)} />
          {type === 'AUTOMATIC' && (
            <FormField label="Target evidence count" htmlFor="milestone-target-count" required>
              <Input id="milestone-target-count" type="number" min={1} value={targetCount} onChange={(e) => setTargetCount(e.target.value)} required />
            </FormField>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" loading={create.isPending}>
              Add milestone
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          Add milestone
        </Button>
      )}
    </div>
  );
}
