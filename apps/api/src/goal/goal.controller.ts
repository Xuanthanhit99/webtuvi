import { Body, Controller, Delete, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { GoalRecordService, type ListGoalsResult } from './record/goal-record.service';
import { GoalMilestoneService } from './milestone/goal-milestone.service';
import { GoalRelationshipService } from './relationship/goal-relationship.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import type { GoalHistoryDto, GoalMilestoneDto, GoalRelationshipDto, GoalSummaryDto } from './goal.mappers';

/**
 * Phases 2/5/6/7/8 API. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`;
 * every underlying query is `userId`-scoped (mirrors `ReviewController`'s own precedent exactly).
 */
@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalController {
  constructor(
    private readonly records: GoalRecordService,
    private readonly milestones: GoalMilestoneService,
    private readonly relationships: GoalRelationshipService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List/filter the caller’s own goals, paginated' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListGoalsQueryDto): Promise<ListGoalsResult> {
    return this.records.list(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGoalDto): Promise<GoalSummaryDto> {
    return this.records.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one goal by id (owner only) — recomputes progress first' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.getOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal’s descriptive fields' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateGoalDto): Promise<GoalSummaryDto> {
    return this.records.update(user.id, id, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get a goal’s lifecycle history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active goal' })
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.pause(user.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused goal' })
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.resume(user.id, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a goal complete (always an explicit user action, never automatic)' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.complete(user.id, id);
  }

  @Post(':id/abandon')
  @ApiOperation({ summary: 'Abandon a goal' })
  abandon(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.abandon(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a goal (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.archive(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a goal (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.remove(user.id, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted goal to its prior status' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalSummaryDto> {
    return this.records.restore(user.id, id);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Create a milestone under a goal' })
  createMilestone(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateMilestoneDto): Promise<GoalMilestoneDto> {
    return this.milestones.create(user.id, id, dto);
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update a milestone’s descriptive fields' })
  updateMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ): Promise<GoalMilestoneDto> {
    return this.milestones.update(user.id, id, milestoneId, dto);
  }

  @Post(':id/milestones/:milestoneId/complete')
  @ApiOperation({ summary: 'Complete a manual milestone' })
  completeMilestone(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('milestoneId') milestoneId: string): Promise<GoalMilestoneDto> {
    return this.milestones.complete(user.id, id, milestoneId);
  }

  @Post(':id/milestones/:milestoneId/fail')
  @ApiOperation({ summary: 'Fail a manual milestone' })
  failMilestone(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('milestoneId') milestoneId: string): Promise<GoalMilestoneDto> {
    return this.milestones.fail(user.id, id, milestoneId);
  }

  @Post(':id/milestones/:milestoneId/archive')
  @ApiOperation({ summary: 'Archive a milestone' })
  archiveMilestone(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('milestoneId') milestoneId: string): Promise<GoalMilestoneDto> {
    return this.milestones.archive(user.id, id, milestoneId);
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'List a goal’s relationships to the caller’s other goals' })
  listRelationships(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GoalRelationshipDto[]> {
    return this.relationships.list(user.id, id);
  }

  @Post(':id/relationships')
  @ApiOperation({ summary: 'Create a relationship to another of the caller’s own goals' })
  createRelationship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateRelationshipDto): Promise<GoalRelationshipDto> {
    return this.relationships.create(user.id, id, dto);
  }

  @Delete(':id/relationships/:relationshipId')
  @ApiOperation({ summary: 'Delete a relationship' })
  removeRelationship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('relationshipId') relationshipId: string): Promise<void> {
    return this.relationships.remove(user.id, id, relationshipId);
  }
}
