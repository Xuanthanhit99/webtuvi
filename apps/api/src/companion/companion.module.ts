import { Module } from '@nestjs/common';
import { CompanionController } from './companion.controller';
import { CompanionService } from './companion.service';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [MemoryModule],
  controllers: [CompanionController],
  providers: [CompanionService],
})
export class CompanionModule {}
