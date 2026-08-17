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
  Query,
} from '@nestjs/common';
import type { WorkoutSet } from '@workout/shared-types';
import { CreateSetDto, UpdateSetDto } from './dto/set.dto';
import { SetsService } from './sets.service';

@Controller('sets')
export class SetsController {
  constructor(private readonly sets: SetsService) {}

  /** `GET /api/sets?exerciseId=…` — sets are always scoped to an exercise. */
  @Get()
  findByExercise(@Query('exerciseId') exerciseId: string): WorkoutSet[] {
    return this.sets.findByExercise(exerciseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): WorkoutSet {
    return this.sets.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSetDto): WorkoutSet {
    return this.sets.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSetDto): WorkoutSet {
    return this.sets.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.sets.remove(id);
  }
}
