/**
 * Transport-level contracts shared by the Nest API and the Next.js client.
 * Keeping these here means an error-shape change breaks compilation on both
 * sides instead of at runtime.
 */

/** Shape Nest's built-in HttpException filter serialises errors into. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
}

/** Every route below is mounted under the API's `/api` global prefix. */
export const API_ROUTES = {
  health: '/health',
  sessions: '/sessions',
  session: (id: string) => `/sessions/${id}`,
  exerciseDefs: '/exercise-defs',
  exerciseDef: (id: string) => `/exercise-defs/${id}`,
  exercises: '/exercises',
  exercise: (id: string) => `/exercises/${id}`,
  sets: '/sets',
  set: (id: string) => `/sets/${id}`,
} as const;
