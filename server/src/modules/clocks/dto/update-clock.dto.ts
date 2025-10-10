import { PartialType } from '@nestjs/swagger';
import { CreateClockDto } from './create-clock.dto';

export class UpdateClockDto extends PartialType(CreateClockDto) {}
