import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/env';
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
    // Reads apps/api/.env, validates it against the Env class, and exposes
    // ConfigService everywhere without re-importing this module.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
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
