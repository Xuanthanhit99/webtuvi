import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { CompanionMessageDto } from '@beaconvie/types';
import { CompanionService } from './companion.service';
import { SendCompanionMessageDto } from './dto/send-companion-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('companion')
@Controller('companion')
@UseGuards(JwtAuthGuard)
export class CompanionController {
  constructor(private readonly companionService: CompanionService) {}

  @Get('messages')
  getMessages(@CurrentUser() user: AuthenticatedUser): Promise<CompanionMessageDto[]> {
    return this.companionService.recentMessages(user.id);
  }

  @Post('messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendCompanionMessageDto,
  ): Promise<CompanionMessageDto[]> {
    return this.companionService.sendMessage(user.id, dto.content);
  }
}
