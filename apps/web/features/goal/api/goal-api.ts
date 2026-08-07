import type {
  GoalCategoryValue,
  GoalHistoryDto,
  GoalMilestoneDto,
  GoalMilestoneTypeValue,
  GoalRelationshipDto,
  GoalRelationshipTypeValue,
  GoalStatusValue,
  GoalSummaryDto,
  GoalTypeValue,
  GoalDifficultyValue,
  GoalVisibilityValue,
  ListGoalsResultDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListGoalsFilters {
  status?: GoalStatusValue;
  category?: GoalCategoryValue;
  page?: number;
  pageSize?: number;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category: GoalCategoryValue;
  type: GoalTypeValue;
  difficulty?: GoalDifficultyValue;
  visibility?: GoalVisibilityValue;
  linkedTag: string;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: GoalCategoryValue;
  difficulty?: GoalDifficultyValue;
  visibility?: GoalVisibilityValue;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: string;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  type: GoalMilestoneTypeValue;
  targetCount?: number;
  dueDate?: string;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const goalApi = {
  list: (filters: ListGoalsFilters = {}) => api.get<ListGoalsResultDto>(`/goals${toQuery(filters)}`),
  get: (id: string) => api.get<GoalSummaryDto>(`/goals/${id}`),
  create: (input: CreateGoalInput) => api.post<GoalSummaryDto>('/goals', input),
  update: (id: string, input: UpdateGoalInput) => api.patch<GoalSummaryDto>(`/goals/${id}`, input),
  history: (id: string) => api.get<GoalHistoryDto[]>(`/goals/${id}/history`),
  pause: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/pause`),
  resume: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/resume`),
  complete: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/complete`),
  abandon: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/abandon`),
  archive: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/archive`),
  remove: (id: string) => api.delete<GoalSummaryDto>(`/goals/${id}`),
  restore: (id: string) => api.post<GoalSummaryDto>(`/goals/${id}/restore`),
  createMilestone: (goalId: string, input: CreateMilestoneInput) => api.post<GoalMilestoneDto>(`/goals/${goalId}/milestones`, input),
  completeMilestone: (goalId: string, milestoneId: string) => api.post<GoalMilestoneDto>(`/goals/${goalId}/milestones/${milestoneId}/complete`),
  failMilestone: (goalId: string, milestoneId: string) => api.post<GoalMilestoneDto>(`/goals/${goalId}/milestones/${milestoneId}/fail`),
  listRelationships: (goalId: string) => api.get<GoalRelationshipDto[]>(`/goals/${goalId}/relationships`),
  createRelationship: (goalId: string, otherGoalId: string, type: GoalRelationshipTypeValue) =>
    api.post<GoalRelationshipDto>(`/goals/${goalId}/relationships`, { goalId: otherGoalId, type }),
  removeRelationship: (goalId: string, relationshipId: string) => api.delete<void>(`/goals/${goalId}/relationships/${relationshipId}`),
};
