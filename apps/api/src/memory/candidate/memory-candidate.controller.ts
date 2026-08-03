import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MemoryCandidateStatus } from '@prisma/client';
import { MemoryCandidateService, type MemoryCandidateDto } from './memory-candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { MemoryDto } from '../memory.mappers';

@ApiTags('memory-candidates')
@Controller('memory/candidates')
@UseGuards(JwtAuthGuard)
export class MemoryCandidateController {
  constructor(private readonly candidateService: MemoryCandidateService) {}

  @Get()
  @ApiOperation({ summary: 'List the caller’s memory candidates, optionally filtered by status' })
  list(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: MemoryCandidateStatus): Promise<MemoryCandidateDto[]> {
    return this.candidateService.list(user.id, status);
  }

  @Post()
  @ApiOperation({ summary: 'Propose a memory candidate from a message the caller actually sent ("Remember this")' })
  propose(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCandidateDto): Promise<MemoryCandidateDto> {
    return this.candidateService.propose(user.id, dto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a candidate — creates the Memory + its first version, idempotently' })
  async accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ memory: MemoryDto; candidate: MemoryCandidateDto }> {
    return this.candidateService.accept(user.id, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a candidate — creates no Memory, idempotently' })
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MemoryCandidateDto> {
    return this.candidateService.reject(user.id, id);
  }
}
