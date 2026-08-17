import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ExerciseDef,
  ExerciseDefWithMuscles,
} from '@workout/shared-types';
import { Store } from '../../common/store';
import type {
  CreateExerciseDefDto,
  UpdateExerciseDefDto,
} from './dto/exercise-def.dto';

@Injectable()
export class ExerciseDefsService {
  constructor(private readonly store: Store) {}

  findAll(): ExerciseDefWithMuscles[] {
    return this.store.exerciseDefs.map((def) => this.withMuscles(def));
  }

  findOne(id: string): ExerciseDefWithMuscles {
    return this.withMuscles(this.require(id));
  }

  create(dto: CreateExerciseDefDto): ExerciseDefWithMuscles {
    const def: ExerciseDef = { id: this.store.id(), name: dto.name };
    this.store.exerciseDefs.push(def);
    this.replaceMuscles(def.id, dto.muscles ?? []);
    return this.withMuscles(def);
  }

  update(id: string, dto: UpdateExerciseDefDto): ExerciseDefWithMuscles {
    const def = this.require(id);
    if (dto.name !== undefined) def.name = dto.name;
    if (dto.muscles !== undefined) this.replaceMuscles(id, dto.muscles);
    return this.withMuscles(def);
  }

  remove(id: string): void {
    const def = this.require(id);
    this.store.exerciseDefs.splice(this.store.exerciseDefs.indexOf(def), 1);
    this.replaceMuscles(id, []);
  }

  /** Throws 404 instead of returning undefined, so callers can stay linear. */
  private require(id: string): ExerciseDef {
    const def = this.store.exerciseDefs.find((d) => d.id === id);
    if (!def)
      throw new NotFoundException(`Exercise definition ${id} not found`);
    return def;
  }

  private replaceMuscles(exerciseDefId: string, muscles: string[]): void {
    const kept = this.store.exerciseMuscles.filter(
      (m) => m.exerciseDefId !== exerciseDefId,
    );
    this.store.exerciseMuscles.length = 0;
    this.store.exerciseMuscles.push(
      ...kept,
      ...muscles.map((targetMuscle) => ({
        id: this.store.id(),
        exerciseDefId,
        targetMuscle,
      })),
    );
  }

  private withMuscles(def: ExerciseDef): ExerciseDefWithMuscles {
    return {
      ...def,
      muscles: this.store.exerciseMuscles.filter(
        (m) => m.exerciseDefId === def.id,
      ),
    };
  }
}
