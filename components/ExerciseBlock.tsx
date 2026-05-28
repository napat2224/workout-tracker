'use client'

import { useState, useRef } from 'react'
import { Exercise, WorkoutSet } from '@/lib/types'

interface Props {
  exercise: Exercise
  onDelete: () => void
  onAddSet: (exerciseId: number, reps: number | null, weight: number | null, notes: string) => Promise<WorkoutSet>
  onUpdateSet: (id: number, reps: number | null, weight: number | null, notes: string) => void
  onDeleteSet: (id: number) => void
}

export default function ExerciseBlock({ exercise, onDelete, onAddSet, onUpdateSet, onDeleteSet }: Props) {
  const [sets, setSets] = useState<WorkoutSet[]>(exercise.sets)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const repsRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    const r = reps ? parseInt(reps) : null
    const w = weight ? parseFloat(weight) : null
    const set = await onAddSet(exercise.id, r, w, notes.trim())
    setSets(prev => [...prev, set])
    setReps(''); setWeight(''); setNotes('')
    repsRef.current?.focus()
  }

  async function handleDeleteSet(id: number) {
    await onDeleteSet(id)
    setSets(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, set_number: i + 1 })))
  }

  return (
    <div className="exercise-block">
      <div className="exercise-block-header">
        <span className="exercise-block-name">{exercise.name}</span>
        <button
          className="btn-danger"
          onClick={() => confirm(`Remove "${exercise.name}"?`) && onDelete()}
        >
          Remove
        </button>
      </div>

      <div className="sets-table">
        <table className="sets-table-inner">
          <thead>
            <tr>
              <th>Set</th><th>Reps</th><th>Weight (kg)</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s, i) => (
              <SetRow
                key={s.id}
                set={s}
                index={i}
                onUpdate={onUpdateSet}
                onDelete={handleDeleteSet}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="add-set-row">
        <input
          ref={repsRef}
          className="input-medium set-input"
          type="number" min="0" placeholder="Reps"
          value={reps} onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="input-medium set-input"
          type="number" step="0.5" min="0" placeholder="kg"
          value={weight} onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="input-medium set-input set-input-notes"
          type="text" placeholder="Notes"
          value={notes} onChange={e => setNotes(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn-secondary" onClick={handleAdd}>+ Add Set</button>
      </div>
    </div>
  )
}

interface SetRowProps {
  set: WorkoutSet
  index: number
  onUpdate: (id: number, reps: number | null, weight: number | null, notes: string) => void
  onDelete: (id: number) => void
}

function SetRow({ set, index, onUpdate, onDelete }: SetRowProps) {
  const [reps, setReps] = useState(set.reps?.toString() ?? '')
  const [weight, setWeight] = useState(set.weight?.toString() ?? '')
  const [notes, setNotes] = useState(set.notes)

  function save() {
    onUpdate(
      set.id,
      reps ? parseInt(reps) : null,
      weight ? parseFloat(weight) : null,
      notes.trim(),
    )
  }

  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <input className="input-medium set-input" type="number" placeholder="—"
          value={reps} onChange={e => setReps(e.target.value)} onBlur={save} />
      </td>
      <td>
        <input className="input-medium set-input" type="number" step="0.5" placeholder="—"
          value={weight} onChange={e => setWeight(e.target.value)} onBlur={save} />
      </td>
      <td>
        <input className="input-medium set-input set-input-notes" type="text" placeholder="—"
          value={notes} onChange={e => setNotes(e.target.value)} onBlur={save} />
      </td>
      <td>
        <button className="btn-icon danger" onClick={() => onDelete(set.id)}>✕</button>
      </td>
    </tr>
  )
}
