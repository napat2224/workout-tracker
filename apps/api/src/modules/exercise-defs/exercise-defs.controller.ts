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
import type { ExerciseDefWithMuscles } from '@workout/shared-types';
import {
  CreateExerciseDefDto,
  UpdateExerciseDefDto,
} from './dto/exercise-def.dto';
import { ExerciseDefsService } from './exercise-defs.service';

@Controller('exercise-defs')
export class ExerciseDefsController {
  constructor(private readonly exerciseDefs: ExerciseDefsService) {}

  @Get()
  findAll(): ExerciseDefWithMuscles[] {
    return this.exerciseDefs.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): ExerciseDefWithMuscles {
    return this.exerciseDefs.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExerciseDefDto): ExerciseDefWithMuscles {
    return this.exerciseDefs.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDefDto,
  ): ExerciseDefWithMuscles {
    return this.exerciseDefs.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.exerciseDefs.remove(id);
  }
}
