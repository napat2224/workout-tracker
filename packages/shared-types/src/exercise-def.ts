/**
 * An exercise *definition* — the catalogue entry ("Bench Press"), not a
 * performed exercise. Maps to the `exercise_def` table in dev.md.
 */
export interface ExerciseDef {
  id: string;
  name: string;
}

/**
 * A muscle targeted by an exercise definition. Maps to `exercise_muscle`.
 * One definition targets many muscles (Bench Press -> chest, triceps, front delts).
 */
export interface ExerciseMuscle {
  id: string;
  exerciseDefId: string;
  targetMuscle: string;
}

/** An exercise definition with its target muscles resolved. */
export interface ExerciseDefWithMuscles extends ExerciseDef {
  muscles: ExerciseMuscle[];
}

export interface CreateExerciseDefDto {
  name: string;
  /** Target muscles, created alongside the definition. */
  muscles?: string[];
}

export interface UpdateExerciseDefDto {
  name?: string;
  muscles?: string[];
}
