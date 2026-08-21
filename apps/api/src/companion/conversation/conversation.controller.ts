import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { ConversationDetailDto, ConversationDto } from '@beaconvie/types';
import { ConversationService, type SendMessageResult } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanionThrottlerGuard } from '../../common/guards/companion-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('companion')
@Controller('companion/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new conversation' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConversationDto): Promise<ConversationDto> {
    return this.conversationService.create(user.id, dto.title);
  }

  @Get()
  @ApiOperation({ summary: 'List this account’s conversations, most recently active first' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<ConversationDto[]> {
    return this.conversationService.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one conversation with its full message history' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ConversationDetailDto> {
    return this.conversationService.getOne(user.id, id);
  }

  @Post(':id/messages')
  @UseGuards(CompanionThrottlerGuard)
  // Sprint 13 fix: `payment` was missing here — every named throttler applies to every guarded
  // route by default unless skipped (see CompanionThrottlerGuard's docstring), so message-sending
  // was also incidentally governed by the unrelated `payment` bucket, the same asymmetry fixed in
  // AuthController around the same time.
  @SkipThrottle({ auth: true, discovery: true, 'discovery-ip': true, payment: true, admin: true })
  @ApiOperation({
    summary: 'Send a user message. If it passes the safety check, open GET .../messages/stream next to generate the reply.',
  })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<SendMessageResult> {
    return this.conversationService.sendMessage(user.id, id, dto.content);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation and its messages' })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.conversationService.delete(user.id, id);
  }
}
