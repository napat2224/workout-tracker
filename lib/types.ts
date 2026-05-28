export interface Workout {
  id: number
  name: string
  date: string
  notes: string
  exercise_count: number
}

export interface Exercise {
  id: number
  workout_id: number
  name: string
  sets: WorkoutSet[]
}

export interface WorkoutSet {
  id: number
  exercise_id: number
  set_number: number
  reps: number | null
  weight: number | null
  notes: string
}

export interface WorkoutDetail {
  id: number
  name: string
  date: string
  notes: string
  exercises: Exercise[]
}

export interface ExerciseHistoryEntry {
  date: string
  workout_name: string
  sets: WorkoutSet[]
  max_weight: number | null
  total_volume: number
}
