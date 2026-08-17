'use server';

import { refresh } from 'next/cache';
import { ApiError, api } from '@/lib/api';

export type ActionState = { error?: string };

/**
 * Server Action: runs on the Next.js server, so it can use the server-only API
 * client directly. The browser posts to Next, Next posts to Nest — no API URL
 * or credentials are exposed to the client bundle.
 */
export async function createSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const date = String(formData.get('date') ?? '').trim();

  try {
    await api.createSession(date ? { date } : {});
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'Could not reach the API',
    };
  }

  // Next 16: refresh the client router so the new session appears. Nothing to
  // invalidate cache-wise because these reads are uncached.
  refresh();
  return {};
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id'));
  await api.deleteSession(id);
  refresh();
}
