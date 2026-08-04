import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MemoryRetrievalService, type RetrievalResultDto } from '../retrieval/memory-retrieval.service';
import { MemoryConflictService, type MemoryConflictDto } from '../conflict/memory-conflict.service';
import { MemoryDuplicateService, type MemoryDuplicatePairDto } from '../duplicate/memory-duplicate.service';
import { MemoryMergeSuggestionService, type MergeSuggestionDto } from '../merge/memory-merge-suggestion.service';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';

/**
 * Read-only Memory Intelligence surfaces (Phase 9) plus the two merge-suggestion decisions —
 * every mutating action here is an explicit user choice (accept/reject), never an automatic
 * one. All four GET endpoints are ownership-scoped implicitly: every underlying service query
 * is filtered by the caller's own `userId`, the same pattern as every other Memory endpoint
 * (see docs/security/memory-privacy.md). Guarded by the same `JwtAuthGuard` +
 * project-wide `CsrfGuard` as the rest of this module — no per-route opt-out.
 */
@ApiTags('memory-intelligence')
@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryIntelligenceController {
  constructor(
    private readonly retrieval: MemoryRetrievalService,
    private readonly conflicts: MemoryConflictService,
    private readonly duplicates: MemoryDuplicateService,
    private readonly mergeSuggestions: MemoryMergeSuggestionService,
  ) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Deterministic, rule-based top memories for the caller — never deleted/archived/rejected/pending, consent-checked, budget-limited' })
  recommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecommendationsQueryDto,
  ): Promise<RetrievalResultDto> {
    return this.retrieval.recommend(user.id, { contextText: query.context, limit: query.limit });
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Detected contradictions between the caller’s own ACCEPTED memories — never auto-resolved' })
  listConflicts(@CurrentUser() user: AuthenticatedUser): Promise<MemoryConflictDto[]> {
    return this.conflicts.detectForUser(user.id);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Detected duplicate pairs among the caller’s own ACCEPTED memories — deterministic text/structure matching, no embeddings' })
  listDuplicates(@CurrentUser() user: AuthenticatedUser): Promise<MemoryDuplicatePairDto[]> {
    return this.duplicates.detectForUser(user.id);
  }

  @Get('merge-suggestions')
  @ApiOperation({ summary: 'Pending merge suggestions derived from duplicate findings — never applied automatically' })
  listMergeSuggestions(@CurrentUser() user: AuthenticatedUser): Promise<MergeSuggestionDto[]> {
    return this.mergeSuggestions.generateForUser(user.id);
  }

  @Post('merge-suggestions/:id/accept')
  @ApiOperation({ summary: 'Accept a merge suggestion — archives the duplicate memory, keeps the primary; content is never rewritten' })
  acceptMergeSuggestion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MergeSuggestionDto> {
    return this.mergeSuggestions.accept(user.id, id);
  }

  @Post('merge-suggestions/:id/reject')
  @ApiOperation({ summary: 'Reject a merge suggestion — the pair is remembered as not-a-duplicate and will not be re-suggested' })
  rejectMergeSuggestion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MergeSuggestionDto> {
    return this.mergeSuggestions.reject(user.id, id);
  }
}
