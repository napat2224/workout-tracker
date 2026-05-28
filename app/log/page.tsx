'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { invoke } from '@/lib/invoke'
import { Exercise, WorkoutSet } from '@/lib/types'
import { todayISO } from '@/lib/utils'
import ExerciseBlock from '@/components/ExerciseBlock'

export default function LogPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'form' | 'editor'>('form')
  const [workoutId, setWorkoutId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('New Workout')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [newExName, setNewExName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const exInputRef = useRef<HTMLInputElement>(null)

  async function handleSaveMeta() {
    const n = name.trim() || 'Workout'
    const workout = await invoke<{ id: number }>('create_workout', { name: n, date: date || todayISO(), notes: notes.trim() })
    setWorkoutId(workout.id)
    setTitle(n)
    setPhase('editor')
    setSuggestions(await invoke<string[]>('get_exercise_names'))
  }

  async function handleAddExercise() {
    const exName = newExName.trim()
    if (!exName || workoutId == null) return
    const ex = await invoke<Exercise>('add_exercise', { workoutId, name: exName })
    setExercises(prev => [...prev, ex])
    setNewExName('')
    exInputRef.current?.focus()
  }

  async function handleDeleteExercise(id: number) {
    await invoke('delete_exercise', { id })
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  async function handleAddSet(exerciseId: number, reps: number | null, weight: number | null, setNotes: string): Promise<WorkoutSet> {
    return invoke<WorkoutSet>('add_set', { exerciseId, reps, weight, notes: setNotes })
  }

  function handleUpdateSet(id: number, reps: number | null, weight: number | null, setNotes: string) {
    invoke('update_set', { id, reps, weight, notes: setNotes })
  }

  function handleDeleteSet(id: number) {
    invoke('delete_set', { id })
  }

  async function handleCancel() {
    if (workoutId != null) {
      if (!confirm('Discard this workout?')) return
      await invoke('delete_workout', { id: workoutId })
    }
    router.push('/')
  }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <button className="btn-ghost" onClick={handleCancel}>✕ Cancel</button>
      </div>

      {phase === 'form' && (
        <div className="workout-form-header">
          <input
            className="input-large"
            type="text"
            placeholder="Workout name (e.g. Push Day)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="input-medium"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <input
            className="input-medium"
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button className="btn-primary" onClick={handleSaveMeta}>Save</button>
        </div>
      )}

      {phase === 'editor' && (
        <>
          <div className="exercise-list">
            {exercises.map(ex => (
              <ExerciseBlock
                key={ex.id}
                exercise={ex}
                onDelete={() => handleDeleteExercise(ex.id)}
                onAddSet={handleAddSet}
                onUpdateSet={handleUpdateSet}
                onDeleteSet={handleDeleteSet}
              />
            ))}
          </div>

          <div className="add-exercise-row">
            <input
              ref={exInputRef}
              className="input-medium"
              type="text"
              placeholder="Exercise name"
              list="exercise-suggestions"
              autoComplete="off"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddExercise()}
            />
            <datalist id="exercise-suggestions">
              {suggestions.map(n => <option key={n} value={n} />)}
            </datalist>
            <button className="btn-secondary" onClick={handleAddExercise}>Add Exercise</button>
          </div>

          <div className="finish-row">
            <button className="btn-primary btn-large" onClick={() => router.push('/')}>
              Finish Workout
            </button>
          </div>
        </>
      )}
    </>
  )
}
