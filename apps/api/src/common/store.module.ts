import { Global, Module } from '@nestjs/common';
import { Store } from './store';

/**
 * Global so every feature module can inject `Store` without re-importing it.
 * This is the seam a real database module would slot into.
 */
@Global()
@Module({
  providers: [Store],
  exports: [Store],
})
export class StoreModule {}
