import { Injectable, NotFoundException } from '@nestjs/common';
import type { Exercise, ExerciseWithSets } from '@workout/shared-types';
import { Store } from '../../common/store';
import { ExerciseDefsService } from '../exercise-defs/exercise-defs.service';
import { SetsService } from '../sets/sets.service';
import type { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly store: Store,
    private readonly exerciseDefs: ExerciseDefsService,
    private readonly sets: SetsService,
  ) {}

  findBySession(sessionId: string): ExerciseWithSets[] {
    return this.store.exercises
      .filter((e) => e.sessionId === sessionId)
      .map((e) => this.hydrate(e));
  }

  findOne(id: string): ExerciseWithSets {
    return this.hydrate(this.require(id));
  }

  create(dto: CreateExerciseDto): ExerciseWithSets {
    this.requireSession(dto.sessionId);
    // Throws 404 through the owning feature if the definition is unknown.
    this.exerciseDefs.findOne(dto.exerciseDefId);

    const exercise: Exercise = {
      id: this.store.id(),
      sessionId: dto.sessionId,
      exerciseDefId: dto.exerciseDefId,
    };
    this.store.exercises.push(exercise);
    return this.hydrate(exercise);
  }

  update(id: string, dto: UpdateExerciseDto): ExerciseWithSets {
    const exercise = this.require(id);
    if (dto.exerciseDefId !== undefined) {
      this.exerciseDefs.findOne(dto.exerciseDefId);
      exercise.exerciseDefId = dto.exerciseDefId;
    }
    return this.hydrate(exercise);
  }

  remove(id: string): void {
    const exercise = this.require(id);
    this.store.exercises.splice(this.store.exercises.indexOf(exercise), 1);
    this.sets.removeByExercise(id);
  }

  /** Cascade used when a parent session is deleted. */
  removeBySession(sessionId: string): void {
    for (const exercise of this.store.exercises.filter(
      (e) => e.sessionId === sessionId,
    )) {
      this.remove(exercise.id);
    }
  }

  private require(id: string): Exercise {
    const exercise = this.store.exercises.find((e) => e.id === id);
    if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);
    return exercise;
  }

  private requireSession(sessionId: string): void {
    if (!this.store.sessions.some((s) => s.id === sessionId)) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
  }

  private hydrate(exercise: Exercise): ExerciseWithSets {
    const { id, name } = this.exerciseDefs.findOne(exercise.exerciseDefId);
    return {
      ...exercise,
      // Only the definition itself travels with a performed exercise; the
      // muscle list belongs to the exercise-library view.
      def: { id, name },
      sets: this.sets.findByExercise(exercise.id),
    };
  }
}
