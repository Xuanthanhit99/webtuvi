'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GoalCategoryValue, GoalDifficultyValue, GoalTypeValue } from '@beaconvie/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dropdown } from '@/components/ui/dropdown';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/toast';
import { goalApi } from '../api/goal-api';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, TYPE_LABELS } from '../labels';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label }));

export function GoalCreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategoryValue>('LEARNING');
  const [type, setType] = useState<GoalTypeValue>('MILESTONE_BASED');
  const [difficulty, setDifficulty] = useState<GoalDifficultyValue>('MEDIUM');
  const [companionVisible, setCompanionVisible] = useState(false);
  const [linkedTag, setLinkedTag] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');

  const create = useMutation({
    mutationFn: () =>
      goalApi.create({
        title,
        description: description || undefined,
        category,
        type,
        difficulty,
        visibility: companionVisible ? 'COMPANION_VISIBLE' : 'PRIVATE',
        linkedTag,
        targetValue: type === 'METRIC_BASED' ? Number(targetValue) : undefined,
        targetUnit: type === 'METRIC_BASED' ? targetUnit || undefined : undefined,
      }),
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created.');
      setTitle('');
      setDescription('');
      setLinkedTag('');
      setTargetValue('');
      setTargetUnit('');
      onCreated(goal.id);
    },
    onError: () => toast.error("Couldn't create that goal. Please try again."),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Create a goal" description="Deterministic — progress is computed from your own real activity, never AI-generated.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <FormField label="Title" htmlFor="goal-title" required>
          <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField label="Description" htmlFor="goal-description">
          <Input id="goal-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <Dropdown id="goal-category" label="Category" value={category} options={CATEGORY_OPTIONS} onChange={(v) => setCategory(v as GoalCategoryValue)} />
        <Dropdown id="goal-type" label="Type" value={type} options={TYPE_OPTIONS} onChange={(v) => setType(v as GoalTypeValue)} />
        <Dropdown
          id="goal-difficulty"
          label="Difficulty"
          value={difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(v) => setDifficulty(v as GoalDifficultyValue)}
        />
        <Checkbox
          id="goal-companion-visible"
          checked={companionVisible}
          onChange={(e) => setCompanionVisible(e.target.checked)}
          label="Let Companion know about this goal (mentions its title naturally in conversation — never invents progress or advice)"
        />
        <FormField
          label="Linked tag"
          htmlFor="goal-linked-tag"
          hint="Tag your journal entries with this to automatically count as evidence toward this goal."
          required
        >
          <Input id="goal-linked-tag" value={linkedTag} onChange={(e) => setLinkedTag(e.target.value)} required />
        </FormField>
        {type === 'METRIC_BASED' && (
          <>
            <FormField label="Target value" htmlFor="goal-target-value" required>
              <Input id="goal-target-value" type="number" min={1} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
            </FormField>
            <FormField label="Target unit" htmlFor="goal-target-unit" hint="e.g. books, sessions">
              <Input id="goal-target-unit" value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} />
            </FormField>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            Create goal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
