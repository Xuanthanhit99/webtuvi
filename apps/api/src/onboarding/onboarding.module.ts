import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { MemoryModule } from '../memory/memory.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [MemoryModule, ActivitiesModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
