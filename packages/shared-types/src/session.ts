import type { ExerciseWithSets } from './exercise';

/**
 * One workout session on a given day. Maps to the `session` table in dev.md.
 * `date` is an ISO date string (`YYYY-MM-DD`) so it survives JSON transport
 * without timezone drift.
 */
export interface Session {
  id: string;
  date: string;
}

/** A session with its exercises and each exercise's sets resolved. */
export interface SessionDetail extends Session {
  exercises: ExerciseWithSets[];
}

export interface CreateSessionDto {
  /** ISO date (`YYYY-MM-DD`). Defaults to today when omitted. */
  date?: string;
}

export interface UpdateSessionDto {
  date?: string;
}
