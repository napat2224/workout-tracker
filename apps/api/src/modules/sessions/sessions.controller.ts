import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { Session, SessionDetail } from '@workout/shared-types';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  findAll(): Session[] {
    return this.sessions.findAll();
  }

  /** Returns the session *with* exercises and sets nested. */
  @Get(':id')
  findOne(@Param('id') id: string): SessionDetail {
    return this.sessions.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSessionDto): Session {
    return this.sessions.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto): Session {
    return this.sessions.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.sessions.remove(id);
  }
}
