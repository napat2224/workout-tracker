import { IsOptional, IsUUID } from 'class-validator';
import type {
  CreateExerciseDto as CreateExerciseContract,
  UpdateExerciseDto as UpdateExerciseContract,
} from '@workout/shared-types';

export class CreateExerciseDto implements CreateExerciseContract {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  exerciseDefId!: string;
}

export class UpdateExerciseDto implements UpdateExerciseContract {
  @IsOptional()
  @IsUUID()
  exerciseDefId?: string;
}
