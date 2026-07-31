import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfiguration } from '../config/configuration';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = this.configService.get<AppConfiguration>('app')!;
    this.client = new Redis(config.redis.url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error.stack);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed', error instanceof Error ? error.stack : undefined);
      return false;
    }
  }
}
