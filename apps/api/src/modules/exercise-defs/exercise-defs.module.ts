import { Module } from '@nestjs/common';
import { ExerciseDefsController } from './exercise-defs.controller';
import { ExerciseDefsService } from './exercise-defs.service';

@Module({
  controllers: [ExerciseDefsController],
  providers: [ExerciseDefsService],
  // Exported so sibling features (exercises) can resolve definitions without
  // reaching into this feature's internals.
  exports: [ExerciseDefsService],
})
export class ExerciseDefsModule {}
