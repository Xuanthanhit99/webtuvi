import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ActivitiesModule } from '../activities/activities.module';
import { AccountExportController } from './export/account-export.controller';
import { AccountExportService } from './export/account-export.service';
import { AccountDeletionController } from './deletion/account-deletion.controller';
import { AccountDeletionService } from './deletion/account-deletion.service';
import { MemoryModule } from '../memory/memory.module';
import { CookieModule } from '../auth/cookie.module';

@Module({
  imports: [ActivitiesModule, MemoryModule, CookieModule],
  controllers: [UsersController, AccountExportController, AccountDeletionController],
  providers: [UsersService, AccountExportService, AccountDeletionService],
  exports: [UsersService],
})
export class UsersModule {}
