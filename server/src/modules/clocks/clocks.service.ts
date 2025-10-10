import { Injectable } from '@nestjs/common';
import { CreateClockDto } from './dto/create-clock.dto';
import { UpdateClockDto } from './dto/update-clock.dto';

@Injectable()
export class ClocksService {
  create(createClockDto: CreateClockDto) {
    return 'This action adds a new clock';
  }

  findAll() {
    return `This action returns all clocks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} clock`;
  }

  update(id: number, updateClockDto: UpdateClockDto) {
    return `This action updates a #${id} clock`;
  }

  remove(id: number) {
    return `This action removes a #${id} clock`;
  }
}
