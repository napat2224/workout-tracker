import { Workout } from '@/lib/types'
import { fmt } from '@/lib/utils'

interface Props {
  workout: Workout
  onDelete: (id: number) => void
  onClick: () => void
}

export default function WorkoutCard({ workout, onDelete, onClick }: Props) {
  return (
    <div className="workout-card" onClick={onClick}>
      <div className="workout-card-info">
        <div className="workout-card-name">{workout.name}</div>
        <div className="workout-card-meta">
          <span>{fmt(workout.date)}</span>
          <span>{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="workout-card-actions">
        <button
          className="btn-icon danger"
          title="Delete workout"
          onClick={e => {
            e.stopPropagation()
            if (confirm(`Delete "${workout.name}"?`)) onDelete(workout.id)
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
