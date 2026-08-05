import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ReflectionHintService, type ReflectionHintDto } from '../../reflection/hint/reflection-hint.service';

/**
 * Phase 10 — Companion's only Reflection surface. A read-only existence check, never content:
 * see ReflectionHintService's own docstring for the exact boundary. Ownership-scoped implicitly
 * (the hint service only ever queries the caller's own candidates).
 */
@ApiTags('companion-reflection')
@Controller('companion')
@UseGuards(JwtAuthGuard)
export class CompanionReflectionController {
  constructor(private readonly hintService: ReflectionHintService) {}

  @Get('reflection-hint')
  @ApiOperation({ summary: 'Whether a READY, Companion-visible reflection candidate currently exists for the caller' })
  hint(@CurrentUser() user: AuthenticatedUser): Promise<ReflectionHintDto> {
    return this.hintService.getHint(user.id);
  }
}
