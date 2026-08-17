/**
 * One working set of a performed exercise. Maps to the `set` table in dev.md.
 * Named `WorkoutSet` because `Set` is a JS built-in.
 */
export interface WorkoutSet {
  id: string;
  exerciseId: string;
  /** Rate of Perceived Exertion, 1-10. Null when not recorded. */
  rpe: number | null;
  /** Load in kilograms. 0 for bodyweight work. */
  weight: number;
  /** Repetitions completed. */
  reps: number;
  /** 1-based ordinal within the exercise. Assigned by the API. */
  setNo: number;
}

export interface CreateSetDto {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe?: number | null;
  /** Omit to append as the next set of the exercise. */
  setNo?: number;
}

export interface UpdateSetDto {
  weight?: number;
  reps?: number;
  rpe?: number | null;
  setNo?: number;
}
