import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ExerciseDefsService } from '../modules/exercise-defs/exercise-defs.service';
import { ExercisesService } from '../modules/exercises/exercises.service';
import { SessionsService } from '../modules/sessions/sessions.service';
import { SetsService } from '../modules/sets/sets.service';

/**
 * The store is in-memory, so every restart begins empty. This puts one
 * realistic workout in place so the web app has something to render.
 * Disable with `SEED_DATA=false`.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly sessions: SessionsService,
    private readonly exercises: ExercisesService,
    private readonly exerciseDefs: ExerciseDefsService,
    private readonly sets: SetsService,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.SEED_DATA === 'false') return;

    const bench = this.exerciseDefs.create({
      name: 'Bench Press',
      muscles: ['chest', 'triceps', 'front delts'],
    });
    const row = this.exerciseDefs.create({
      name: 'Barbell Row',
      muscles: ['lats', 'upper back', 'biceps'],
    });
    this.exerciseDefs.create({
      name: 'Back Squat',
      muscles: ['quads', 'glutes'],
    });

    const session = this.sessions.create({ date: this.daysAgo(1) });
    const benchExercise = this.exercises.create({
      sessionId: session.id,
      exerciseDefId: bench.id,
    });
    const rowExercise = this.exercises.create({
      sessionId: session.id,
      exerciseDefId: row.id,
    });

    for (const [weight, reps, rpe] of [
      [60, 8, 7],
      [65, 6, 8],
      [65, 5, 9],
    ]) {
      this.sets.create({ exerciseId: benchExercise.id, weight, reps, rpe });
    }
    for (const [weight, reps, rpe] of [
      [50, 10, 7],
      [50, 10, 8],
    ]) {
      this.sets.create({ exerciseId: rowExercise.id, weight, reps, rpe });
    }

    this.logger.log('Seeded demo workout data (set SEED_DATA=false to skip)');
  }

  private daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }
}
