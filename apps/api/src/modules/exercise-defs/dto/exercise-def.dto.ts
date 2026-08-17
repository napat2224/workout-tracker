import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type {
  CreateExerciseDefDto as CreateExerciseDefContract,
  UpdateExerciseDefDto as UpdateExerciseDefContract,
} from '@workout/shared-types';

/**
 * `implements` the shared contract, so if the front-end contract changes and
 * this class is not updated, the API stops compiling. The decorators add the
 * runtime half that TypeScript interfaces cannot provide.
 */
export class CreateExerciseDefDto implements CreateExerciseDefContract {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  muscles?: string[];
}

export class UpdateExerciseDefDto implements UpdateExerciseDefContract {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  muscles?: string[];
}
