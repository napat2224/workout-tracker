'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { invoke } from '@/lib/invoke'
import { Workout, WorkoutDetail } from '@/lib/types'
import { calcStreak, fmt, startOfWeekISO, todayISO } from '@/lib/utils'
import WorkoutCard from '@/components/WorkoutCard'
import DetailModal from '@/components/DetailModal'

export default function DashboardPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [detail, setDetail] = useState<WorkoutDetail | null>(null)

  const load = useCallback(async () => {
    setWorkouts(await invoke<Workout[]>('get_workouts'))
  }, [])

  useEffect(() => { load() }, [load])

  const week = startOfWeekISO()

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
        <h1>Dashboard</h1>
        <span className="date-badge">{fmt(todayISO())}</span>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{workouts.length || '—'}</div>
          <div className="stat-label">Total Workouts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{workouts.filter(w => w.date >= week).length || '—'}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{calcStreak(workouts) || '—'}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Recent Workouts</h2>
        <button className="btn-primary" onClick={() => router.push('/log')}>+ Start Workout</button>
      </div>

      <div className="workout-list">
        {workouts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏋️</div>
            No workouts yet. Hit <strong>+ Start Workout</strong> to begin.
          </div>
        ) : (
          workouts.slice(0, 5).map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} onClick={() => openDetail(w.id)} />
          ))
        )}
      </div>

      {detail && <DetailModal detail={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
