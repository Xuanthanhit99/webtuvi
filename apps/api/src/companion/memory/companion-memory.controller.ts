import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MemoryType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../conversation/conversation.service';
import { MemoryExplanationService, type MemoryExplanationDto } from './memory-explanation.service';
import { MemorySuggestionService } from './memory-suggestion.service';
import { CompanionForgetService } from './companion-forget.service';
import { DismissSuggestionDto } from './dto/dismiss-suggestion.dto';
import { ConfirmDeleteDto } from './dto/confirm-delete.dto';
import { ConfirmNeverRememberDto } from './dto/confirm-never-remember.dto';
import type { MemoryReferenceDto } from './memory-reference.types';

/**
 * Every mutation here maps to an existing Sprint 3A/3B Memory API call (delete, consent update)
 * — this controller adds no new way for memory to be created, changed, or deleted, only new,
 * explicit, confirmation-gated entry points into the ones that already exist. See
 * docs/architecture/companion-memory-integration.md "Forget flow"/"Memory suggestions".
 */
@ApiTags('companion-memory')
@Controller('companion')
@UseGuards(JwtAuthGuard)
export class CompanionMemoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly explanation: MemoryExplanationService,
    private readonly suggestions: MemorySuggestionService,
    private readonly forget: CompanionForgetService,
  ) {}

  @Get('conversations/:conversationId/messages/:messageId/memory-explanation/:memoryId')
  @ApiOperation({ summary: 'Recompute the "I remembered this because..." explanation for one memory used in a past message — reflects current consent, not a frozen snapshot' })
  async explainUsedMemory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('memoryId') memoryId: string,
  ): Promise<MemoryExplanationDto> {
    await this.conversationService.findOwned(user.id, conversationId);

    const message = await this.prisma.conversationMessage.findFirst({ where: { id: messageId, conversationId } });
    if (!message) {
      throw new NotFoundException({ code: 'MESSAGE_NOT_FOUND', message: 'That message was not found.' });
    }

    const metadata = message.metadata as { memoryUsage?: { used: MemoryReferenceDto[] } } | null;
    const reference = metadata?.memoryUsage?.used.find((ref) => ref.memoryId === memoryId);
    if (!reference) {
      throw new NotFoundException({ code: 'MEMORY_REFERENCE_NOT_FOUND', message: 'That memory was not used in this message.' });
    }

    return this.explanation.explain(user.id, reference);
  }

  @Post('memory-suggestions/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '"Not now" — records that a suggestion was declined (observability only); never creates or touches any Memory row' })
  async dismissSuggestion(@CurrentUser() user: AuthenticatedUser, @Body() dto: DismissSuggestionDto): Promise<void> {
    await this.suggestions.dismiss(user.id, dto.type as MemoryType);
  }

  @Post('memory-forget/confirm-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Explicit confirmation of a detected forget-intent — deletes the confirmed memories via the existing Memory API, never automatic' })
  async confirmDelete(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmDeleteDto): Promise<void> {
    await this.forget.confirmDelete(user.id, dto.memoryIds);
  }

  @Post('memory-forget/confirm-never-remember')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Explicit confirmation of a detected "never remember this type" forget-intent — sets consent to DENY_TYPE via the existing consent API' })
  async confirmNeverRemember(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmNeverRememberDto): Promise<void> {
    await this.forget.confirmNeverRemember(user.id, dto.type as MemoryType);
  }
}
