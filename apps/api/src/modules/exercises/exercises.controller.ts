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
import type { ExerciseWithSets } from '@workout/shared-types';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  /** `GET /api/exercises?sessionId=…` */
  @Get()
  findBySession(@Query('sessionId') sessionId: string): ExerciseWithSets[] {
    return this.exercises.findBySession(sessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): ExerciseWithSets {
    return this.exercises.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExerciseDto): ExerciseWithSets {
    return this.exercises.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
  ): ExerciseWithSets {
    return this.exercises.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.exercises.remove(id);
  }
}
