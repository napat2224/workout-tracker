import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type {
  Exercise,
  ExerciseDef,
  HealthStatus,
  Session,
  SessionDetail,
} from '@workout/shared-types';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts so tests exercise the same request pipeline.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports health', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect((res.body as HealthStatus).status).toBe('ok');
  });

  it('creates a session and reads it back with nested exercises', async () => {
    const sessionRes = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ date: '2026-01-15' })
      .expect(201);
    const session = sessionRes.body as Session;

    const defRes = await request(app.getHttpServer())
      .post('/api/exercise-defs')
      .send({ name: 'Deadlift', muscles: ['hamstrings', 'glutes'] })
      .expect(201);
    const def = defRes.body as ExerciseDef;

    const exerciseRes = await request(app.getHttpServer())
      .post('/api/exercises')
      .send({ sessionId: session.id, exerciseDefId: def.id })
      .expect(201);
    const exercise = exerciseRes.body as Exercise;

    await request(app.getHttpServer())
      .post('/api/sets')
      .send({ exerciseId: exercise.id, weight: 100, reps: 5, rpe: 8 })
      .expect(201);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/sessions/${session.id}`)
      .expect(200);
    const detail = detailRes.body as SessionDetail;

    expect(detail.exercises).toHaveLength(1);
    expect(detail.exercises[0].def.name).toBe('Deadlift');
    expect(detail.exercises[0].sets[0].setNo).toBe(1);
  });

  it('rejects an unknown body key', () => {
    return request(app.getHttpServer())
      .post('/api/sessions')
      .send({ date: '2026-01-15', sneaky: true })
      .expect(400);
  });

  it('404s on a missing session', () => {
    return request(app.getHttpServer())
      .get('/api/sessions/6b1f6a1e-0000-4000-8000-000000000000')
      .expect(404);
  });
});
