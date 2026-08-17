import { Module } from '@nestjs/common';
import { ExerciseDefsModule } from '../exercise-defs/exercise-defs.module';
import { SetsModule } from '../sets/sets.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  // Importing the modules — not re-declaring their providers — is what keeps
  // each feature the single owner of its own rules.
  imports: [ExerciseDefsModule, SetsModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
