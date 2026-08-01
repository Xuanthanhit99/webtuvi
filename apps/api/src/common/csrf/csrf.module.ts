import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfService } from './csrf.service';
import { CsrfGuard } from './csrf.guard';

@Global()
@Module({
  providers: [CsrfService, { provide: APP_GUARD, useClass: CsrfGuard }],
  exports: [CsrfService],
})
export class CsrfModule {}
