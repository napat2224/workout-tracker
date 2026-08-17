import { IsDateString, IsOptional } from 'class-validator';
import type {
  CreateSessionDto as CreateSessionContract,
  UpdateSessionDto as UpdateSessionContract,
} from '@workout/shared-types';

export class CreateSessionDto implements CreateSessionContract {
  /** ISO date (`YYYY-MM-DD`). Defaults to today in the service. */
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateSessionDto implements UpdateSessionContract {
  @IsOptional()
  @IsDateString()
  date?: string;
}
