import 'server-only';

import {
  API_ROUTES,
  type ApiErrorBody,
  type CreateSessionDto,
  type ExerciseDefWithMuscles,
  type HealthStatus,
  type Session,
  type SessionDetail,
} from '@workout/shared-types';

/**
 * Server-side client for the Nest API.
 *
 * `server-only` makes importing this from a Client Component a build error —
 * the API base URL (and later, credentials) never reach the browser. Client
 * Components reach the API through the `/api/*` rewrite in next.config.ts
 * instead, or through a Server Action.
 */

/** Nest runs behind its own origin in dev; in prod this is an internal URL. */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    // Next 16 does not cache fetch by default, so reads are always fresh.
    // Opt into caching per-call with `use cache` when a route can tolerate it.
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? response.statusText);
    throw new ApiError(response.status, message);
  }

  // 204 responses (DELETE) have no body to parse.
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  health: () => request<HealthStatus>(API_ROUTES.health),

  listSessions: () => request<Session[]>(API_ROUTES.sessions),

  getSession: (id: string) => request<SessionDetail>(API_ROUTES.session(id)),

  createSession: (dto: CreateSessionDto) =>
    request<Session>(API_ROUTES.sessions, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  deleteSession: (id: string) =>
    request<void>(API_ROUTES.session(id), { method: 'DELETE' }),

  listExerciseDefs: () =>
    request<ExerciseDefWithMuscles[]>(API_ROUTES.exerciseDefs),
};

export { ApiError };
