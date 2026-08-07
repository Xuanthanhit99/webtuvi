import { IsIn, IsString } from 'class-validator';
import type { GoalRelationshipType } from '@prisma/client';

const RELATIONSHIP_TYPES: GoalRelationshipType[] = ['PARENT_CHILD', 'RELATED'];

/** `goalId` is the *other* goal — the caller's own goal (from the route's `:id`) is always
 * goalA for PARENT_CHILD (the caller's goal is the parent) or the canonical-first side for
 * RELATED. Ownership of `goalId` is re-checked by the service layer, never trusted from the
 * client. */
export class CreateRelationshipDto {
  @IsString()
  goalId!: string;

  @IsIn(RELATIONSHIP_TYPES)
  type!: GoalRelationshipType;
}
