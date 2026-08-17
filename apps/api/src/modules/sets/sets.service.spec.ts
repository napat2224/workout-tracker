import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Store } from '../../common/store';
import { SetsService } from './sets.service';

/**
 * Feature modules make this possible: `sets` only depends on `Store`, so its
 * tests need nothing else from the app.
 */
describe('SetsService', () => {
  let sets: SetsService;
  let store: Store;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SetsService, Store],
    }).compile();

    sets = moduleRef.get(SetsService);
    store = moduleRef.get(Store);
    store.exercises.push({
      id: 'ex-1',
      sessionId: 'ses-1',
      exerciseDefId: 'def-1',
    });
  });

  it('numbers sets sequentially within an exercise', () => {
    const first = sets.create({ exerciseId: 'ex-1', weight: 60, reps: 8 });
    const second = sets.create({ exerciseId: 'ex-1', weight: 65, reps: 6 });

    expect(first.setNo).toBe(1);
    expect(second.setNo).toBe(2);
  });

  it('defaults a missing RPE to null rather than undefined', () => {
    expect(sets.create({ exerciseId: 'ex-1', weight: 60, reps: 8 }).rpe).toBeNull();
  });

  it('rejects sets for an unknown exercise', () => {
    expect(() =>
      sets.create({ exerciseId: 'nope', weight: 60, reps: 8 }),
    ).toThrow(NotFoundException);
  });

  it('removes every set of an exercise on cascade', () => {
    sets.create({ exerciseId: 'ex-1', weight: 60, reps: 8 });
    sets.create({ exerciseId: 'ex-1', weight: 65, reps: 6 });

    sets.removeByExercise('ex-1');

    expect(sets.findByExercise('ex-1')).toEqual([]);
  });
});
