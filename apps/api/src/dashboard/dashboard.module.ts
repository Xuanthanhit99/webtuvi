import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MemoryModule } from '../memory/memory.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [MemoryModule, ActivitiesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
