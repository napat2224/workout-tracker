import { Module } from '@nestjs/common';
import { SeedService } from './common/seed.service';
import { StoreModule } from './common/store.module';
import { ExerciseDefsModule } from './modules/exercise-defs/exercise-defs.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { HealthModule } from './modules/health/health.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SetsModule } from './modules/sets/sets.module';

/**
 * The root module wires features together and owns nothing itself — no
 * controllers, no business logic. Adding a feature means adding one line here.
 */
@Module({
  imports: [
    StoreModule,
    HealthModule,
    ExerciseDefsModule,
    ExercisesModule,
    SessionsModule,
    SetsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
