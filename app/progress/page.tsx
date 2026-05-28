'use client'

import { useEffect, useState } from 'react'
import { invoke } from '@/lib/invoke'
import { ExerciseHistoryEntry } from '@/lib/types'
import { fmt } from '@/lib/utils'

export default function ProgressPage() {
  const [exerciseName, setExerciseName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<ExerciseHistoryEntry[] | null>(null)
  const [searched, setSearched] = useState('')

  useEffect(() => {
    invoke<string[]>('get_exercise_names').then(setSuggestions)
  }, [])

  async function handleLoad() {
    const name = exerciseName.trim()
    if (!name) return
    setHistory(await invoke<ExerciseHistoryEntry[]>('get_exercise_history', { name }))
    setSearched(name)
  }

  const maxWeights = history?.filter(e => e.max_weight != null) ?? []
  const chartMax = maxWeights.length ? Math.max(...maxWeights.map(e => e.max_weight!)) : 1

  return (
    <>
      <div className="page-header">
        <h1>Progress</h1>
      </div>

      <div className="progress-search-row">
        <input
          className="input-medium"
          type="text"
          placeholder="Search exercise…"
          list="progress-suggestions"
          autoComplete="off"
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLoad()}
        />
        <datalist id="progress-suggestions">
          {suggestions.map(n => <option key={n} value={n} />)}
        </datalist>
        <button className="btn-primary" onClick={handleLoad}>View Progress</button>
      </div>

      {history !== null && (
        history.length === 0 ? (
          <div className="empty-state">
            No history found for <strong>{searched}</strong>.
          </div>
        ) : (
          <>
            {maxWeights.length > 0 && (
              <>
                <h2 className="progress-section-title">Max Weight per Session</h2>
                <div className="bar-chart">
                  {[...maxWeights].reverse().slice(0, 10).map((entry, i) => (
                    <div key={i} className="bar-row">
                      <div className="bar-label">{entry.date.slice(5)}</div>
                      <div className="bar-wrap">
                        <div className="bar-fill" style={{ width: `${(entry.max_weight! / chartMax) * 100}%` }} />
                      </div>
                      <div className="bar-value">{entry.max_weight} kg</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="progress-section-title" style={{ marginTop: 24 }}>Session Log</h2>

            {history.map((entry, i) => (
              <div key={i} className="progress-entry">
                <div className="progress-entry-header">
                  <div>
                    <div className="progress-entry-date">{fmt(entry.date)}</div>
                    <div className="progress-entry-meta">{entry.workout_name}</div>
                  </div>
                  <div className="progress-badges">
                    {entry.max_weight != null && (
                      <span className="badge highlight">⬆ {entry.max_weight} kg</span>
                    )}
                    {entry.total_volume > 0 && (
                      <span className="badge">Vol: {Math.round(entry.total_volume)} kg</span>
                    )}
                    <span className="badge">{entry.sets.length} set{entry.sets.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {entry.sets.length > 0 && (
                  <table className="modal-sets-table">
                    <thead>
                      <tr><th>Set</th><th>Reps</th><th>Weight</th></tr>
                    </thead>
                    <tbody>
                      {entry.sets.map(s => (
                        <tr key={s.id}>
                          <td>{s.set_number}</td>
                          <td>{s.reps ?? '—'}</td>
                          <td>{s.weight != null ? `${s.weight} kg` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </>
        )
      )}
    </>
  )
}
