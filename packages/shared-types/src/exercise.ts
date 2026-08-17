import type { ExerciseDef } from './exercise-def';
import type { WorkoutSet } from './set';

/**
 * An exercise *performed* inside a session — the join between a session and an
 * exercise definition. Maps to the `exercise` table in dev.md.
 */
export interface Exercise {
  id: string;
  sessionId: string;
  exerciseDefId: string;
}

/** A performed exercise with its definition and sets resolved. */
export interface ExerciseWithSets extends Exercise {
  def: ExerciseDef;
  sets: WorkoutSet[];
}

export interface CreateExerciseDto {
  sessionId: string;
  exerciseDefId: string;
}

export interface UpdateExerciseDto {
  exerciseDefId?: string;
}
