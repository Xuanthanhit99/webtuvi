import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { OnboardingStateDto } from '@beaconvie/types';
import { OnboardingService } from './onboarding.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SelectDiscoveryDto } from './dto/select-discovery.dto';
import { MemoryConsentDto } from './dto/memory-consent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

/** Conversational onboarding — see docs/reference Module 7. */
@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  getState(@CurrentUser() user: AuthenticatedUser): Promise<OnboardingStateDto> {
    return this.onboardingService.getState(user.id);
  }

  @Post('message')
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto): Promise<OnboardingStateDto> {
    return this.onboardingService.sendMessage(user.id, dto.content);
  }

  @Post('memory/consent')
  respondToMemoryConsent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MemoryConsentDto,
  ): Promise<OnboardingStateDto> {
    return this.onboardingService.respondToMemoryConsent(user.id, dto.accepted);
  }

  @Post('discovery/select')
  selectDiscovery(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectDiscoveryDto,
  ): Promise<OnboardingStateDto> {
    return this.onboardingService.selectDiscovery(user.id, dto.choice);
  }

  @Post('complete')
  async complete(@CurrentUser() user: AuthenticatedUser): Promise<{ message: string }> {
    await this.onboardingService.complete(user.id);
    return { message: 'Onboarding complete' };
  }

  @Post('skip')
  async skip(@CurrentUser() user: AuthenticatedUser): Promise<{ message: string }> {
    await this.onboardingService.skip(user.id);
    return { message: 'Onboarding skipped' };
  }
}
