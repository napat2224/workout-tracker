import { WorkoutDetail } from '@/lib/types'
import { fmt } from '@/lib/utils'

interface Props {
  detail: WorkoutDetail
  onClose: () => void
}

export default function DetailModal({ detail, onClose }: Props) {
  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{detail.name}</h2>
          <div className="modal-header-meta">
            <span className="date-badge">{fmt(detail.date)}</span>
            <button className="btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body">
          {detail.exercises.length === 0 ? (
            <div className="empty-state">No exercises logged.</div>
          ) : (
            detail.exercises.map(ex => (
              <div key={ex.id} className="modal-exercise">
                <div className="modal-exercise-name">{ex.name}</div>
                {ex.sets.length > 0 ? (
                  <table className="modal-sets-table">
                    <thead>
                      <tr>
                        <th>Set</th><th>Reps</th><th>Weight</th><th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map(s => (
                        <tr key={s.id}>
                          <td>{s.set_number}</td>
                          <td>{s.reps ?? '—'}</td>
                          <td>{s.weight != null ? `${s.weight} kg` : '—'}</td>
                          <td>{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div>No sets logged.</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
