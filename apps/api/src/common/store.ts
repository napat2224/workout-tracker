import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  Exercise,
  ExerciseDef,
  ExerciseMuscle,
  Session,
  WorkoutSet,
} from '@workout/shared-types';

/**
 * Process-local persistence stand-in. Every feature service talks to this
 * instead of holding its own arrays, so swapping in SQLite/Prisma later means
 * replacing this one provider rather than touching each feature.
 *
 * Data is lost on restart — see explaination.md, "What is deliberately not done".
 */
@Injectable()
export class Store {
  readonly sessions: Session[] = [];
  readonly exerciseDefs: ExerciseDef[] = [];
  readonly exerciseMuscles: ExerciseMuscle[] = [];
  readonly exercises: Exercise[] = [];
  readonly sets: WorkoutSet[] = [];

  id(): string {
    return randomUUID();
  }
}
