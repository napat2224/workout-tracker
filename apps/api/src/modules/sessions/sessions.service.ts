import { Injectable, NotFoundException } from '@nestjs/common';
import type { Session, SessionDetail } from '@workout/shared-types';
import { Store } from '../../common/store';
import { ExercisesService } from '../exercises/exercises.service';
import type { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly store: Store,
    private readonly exercises: ExercisesService,
  ) {}

  /** Newest first — the order the history screen wants. */
  findAll(): Session[] {
    return [...this.store.sessions].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }

  /** The read model the front-end renders a whole workout from. */
  findOne(id: string): SessionDetail {
    const session = this.require(id);
    return { ...session, exercises: this.exercises.findBySession(id) };
  }

  create(dto: CreateSessionDto): Session {
    const session: Session = {
      id: this.store.id(),
      date: dto.date ?? new Date().toISOString().slice(0, 10),
    };
    this.store.sessions.push(session);
    return session;
  }

  update(id: string, dto: UpdateSessionDto): Session {
    const session = this.require(id);
    if (dto.date !== undefined) session.date = dto.date;
    return session;
  }

  remove(id: string): void {
    const session = this.require(id);
    this.store.sessions.splice(this.store.sessions.indexOf(session), 1);
    this.exercises.removeBySession(id);
  }

  private require(id: string): Session {
    const session = this.store.sessions.find((s) => s.id === id);
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }
}
