'use client';

import { useActionState } from 'react';
import { type ActionState, createSessionAction } from './actions';

/**
 * The only Client Component on the page — it needs interactivity for the
 * pending state. It never imports lib/api.ts; it calls a Server Action.
 */
export function NewSessionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createSessionAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input
        type="date"
        name="date"
        aria-label="Session date"
        className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add session'}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
