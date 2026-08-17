import { connection } from 'next/server';
import type { SessionDetail, WorkoutSet } from '@workout/shared-types';
import { api } from '@/lib/api';
import { deleteSessionAction } from './actions';
import { NewSessionForm } from './new-session-form';

/**
 * Server Component: this `await` runs on the Next.js server and hits Nest over
 * HTTP. The browser only ever receives the rendered result.
 */
export default async function Home() {
  // Without this the page is prerendered at build time — when the API is not
  // running — and every visitor gets that stale HTML. `connection()` stops
  // prerendering here, so the fetch below happens per request.
  await connection();

  let sessions: SessionDetail[] = [];
  let apiError: string | null = null;

  try {
    const summaries = await api.listSessions();
    // One detail request per session. Fine at this size; a `GET /sessions?
    // include=exercises` endpoint is the fix when the list grows.
    sessions = await Promise.all(summaries.map((s) => api.getSession(s.id)));
  } catch (error) {
    apiError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Workout Tracker</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Next.js renders this page on the server and reads from the Nest API.
        </p>
      </header>

      {apiError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="font-medium text-red-600 dark:text-red-400">
            Could not reach the API: {apiError}
          </p>
          <p className="mt-1 text-black/60 dark:text-white/60">
            Start it with <code className="font-mono">pnpm dev</code> from the repo root.
          </p>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <NewSessionForm />
          </section>

          <section className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-sm text-black/60 dark:text-white/60">
                No sessions yet. Add one above.
              </p>
            ) : (
              sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}

function SessionCard({ session }: { session: SessionDetail }) {
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <article className="rounded-xl border border-black/10 p-5 dark:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{session.date}</h2>
          <p className="text-sm text-black/60 dark:text-white/60">
            {session.exercises.length} exercises · {totalSets} sets
          </p>
        </div>
        <form action={deleteSessionAction}>
          <input type="hidden" name="id" value={session.id} />
          <button
            type="submit"
            className="text-sm text-black/50 underline-offset-4 hover:underline dark:text-white/50"
          >
            Delete
          </button>
        </form>
      </div>

      {session.exercises.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {session.exercises.map((exercise) => (
            <li key={exercise.id}>
              <p className="text-sm font-medium">{exercise.def.name}</p>
              <p className="font-mono text-sm text-black/60 dark:text-white/60">
                {exercise.sets.map(formatSet).join('  ·  ') || 'no sets logged'}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function formatSet(set: WorkoutSet): string {
  const rpe = set.rpe === null ? '' : ` @${set.rpe}`;
  return `${set.weight}kg × ${set.reps}${rpe}`;
}
