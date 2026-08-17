import { IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import type {
  CreateSetDto as CreateSetContract,
  UpdateSetDto as UpdateSetContract,
} from '@workout/shared-types';

export class CreateSetDto implements CreateSetContract {
  @IsUUID()
  exerciseId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  weight!: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  reps!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(10)
  rpe?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  setNo?: number;
}

export class UpdateSetDto implements UpdateSetContract {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  reps?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(10)
  rpe?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  setNo?: number;
}
