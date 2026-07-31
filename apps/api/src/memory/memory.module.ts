import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [ActivitiesModule],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
