import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClocksService } from './clocks.service';
import { CreateClockDto } from './dto/create-clock.dto';
import { UpdateClockDto } from './dto/update-clock.dto';

@Controller('clocks')
export class ClocksController {
  constructor(private readonly clocksService: ClocksService) {}

  @Post()
  create(@Body() createClockDto: CreateClockDto) {
    return this.clocksService.create(createClockDto);
  }

  @Get()
  findAll() {
    return this.clocksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clocksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClockDto: UpdateClockDto) {
    return this.clocksService.update(+id, updateClockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clocksService.remove(+id);
  }
}
