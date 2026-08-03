import { Body, Controller, Get, Param, ParseEnumPipe, Put, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemoryType } from '@prisma/client';
import { MemoryConsentService, type MemoryConsentSummaryDto } from './memory-consent.service';
import { UpdateGlobalConsentDto } from './dto/update-global-consent.dto';
import { UpdateTypeConsentDto } from './dto/update-type-consent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('memory-consent')
@Controller('memory/consents')
@UseGuards(JwtAuthGuard)
export class MemoryConsentController {
  constructor(private readonly consentService: MemoryConsentService) {}

  @Get()
  @ApiOperation({ summary: 'Get the caller’s global memory consent mode and any per-type overrides' })
  get(@CurrentUser() user: AuthenticatedUser): Promise<MemoryConsentSummaryDto> {
    return this.consentService.getSummary(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Set the global memory consent mode' })
  updateGlobal(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateGlobalConsentDto): Promise<MemoryConsentSummaryDto> {
    return this.consentService.updateGlobal(user.id, dto.mode);
  }

  @Patch(':type')
  @ApiOperation({ summary: 'Set a per-type consent override (e.g. HEALTH requires an explicit ALLOW_TYPE here)' })
  updateType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type', new ParseEnumPipe(MemoryType)) type: MemoryType,
    @Body() dto: UpdateTypeConsentDto,
  ): Promise<MemoryConsentSummaryDto> {
    return this.consentService.updateType(user.id, type, dto.mode);
  }
}
