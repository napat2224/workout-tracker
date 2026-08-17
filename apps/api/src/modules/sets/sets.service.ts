import { Injectable, NotFoundException } from '@nestjs/common';
import type { WorkoutSet } from '@workout/shared-types';
import { Store } from '../../common/store';
import type { CreateSetDto, UpdateSetDto } from './dto/set.dto';

@Injectable()
export class SetsService {
  constructor(private readonly store: Store) {}

  /**
   * Note the dependency direction: `sets` never injects `ExercisesService`,
   * it checks the parent row through the store. `exercises` injects this
   * service to build its detail view, so the module graph stays acyclic.
   */
  findByExercise(exerciseId: string): WorkoutSet[] {
    return this.store.sets
      .filter((s) => s.exerciseId === exerciseId)
      .sort((a, b) => a.setNo - b.setNo);
  }

  findOne(id: string): WorkoutSet {
    return this.require(id);
  }

  create(dto: CreateSetDto): WorkoutSet {
    this.requireExercise(dto.exerciseId);
    const existing = this.findByExercise(dto.exerciseId);
    const set: WorkoutSet = {
      id: this.store.id(),
      exerciseId: dto.exerciseId,
      weight: dto.weight,
      reps: dto.reps,
      rpe: dto.rpe ?? null,
      setNo: dto.setNo ?? existing.length + 1,
    };
    this.store.sets.push(set);
    return set;
  }

  update(id: string, dto: UpdateSetDto): WorkoutSet {
    const set = this.require(id);
    if (dto.weight !== undefined) set.weight = dto.weight;
    if (dto.reps !== undefined) set.reps = dto.reps;
    if (dto.rpe !== undefined) set.rpe = dto.rpe;
    if (dto.setNo !== undefined) set.setNo = dto.setNo;
    return set;
  }

  remove(id: string): void {
    const set = this.require(id);
    this.store.sets.splice(this.store.sets.indexOf(set), 1);
  }

  /** Cascade used when a parent exercise is deleted. */
  removeByExercise(exerciseId: string): void {
    const kept = this.store.sets.filter((s) => s.exerciseId !== exerciseId);
    this.store.sets.length = 0;
    this.store.sets.push(...kept);
  }

  private require(id: string): WorkoutSet {
    const set = this.store.sets.find((s) => s.id === id);
    if (!set) throw new NotFoundException(`Set ${id} not found`);
    return set;
  }

  private requireExercise(exerciseId: string): void {
    if (!this.store.exercises.some((e) => e.id === exerciseId)) {
      throw new NotFoundException(`Exercise ${exerciseId} not found`);
    }
  }
}
