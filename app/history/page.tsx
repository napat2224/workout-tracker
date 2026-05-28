'use client'

import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@/lib/invoke'
import { Workout, WorkoutDetail } from '@/lib/types'
import WorkoutCard from '@/components/WorkoutCard'
import DetailModal from '@/components/DetailModal'

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<WorkoutDetail | null>(null)

  const load = useCallback(async () => {
    setWorkouts(await invoke<Workout[]>('get_workouts'))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = workouts.filter(w => {
    const q = query.toLowerCase()
    return w.name.toLowerCase().includes(q) || w.date.includes(q)
  })

  async function handleDelete(id: number) {
    await invoke('delete_workout', { id })
    load()
  }

  async function openDetail(id: number) {
    setDetail(await invoke<WorkoutDetail>('get_workout_detail', { id }))
  }

  return (
    <>
      <div className="page-header">
        <h1>History</h1>
        <input
          className="input-search"
          type="text"
          placeholder="Search workouts…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="workout-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            No workouts found.
          </div>
        ) : (
          filtered.map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} onClick={() => openDetail(w.id)} />
          ))
        )}
      </div>

      {detail && <DetailModal detail={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
