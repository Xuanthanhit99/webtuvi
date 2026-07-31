import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is up' })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiExcludeEndpoint()
  async ready(@Res() res: Response) {
    const [database, redis] = await Promise.all([this.prisma.isHealthy(), this.redis.isHealthy()]);
    const ready = database && redis;

    res.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: ready ? 'ok' : 'degraded',
      checks: { database: database ? 'ok' : 'down', redis: redis ? 'ok' : 'down' },
    });
  }
}
