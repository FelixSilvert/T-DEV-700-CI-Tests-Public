import { Module } from '@nestjs/common';
import { ClocksService } from './clocks.service';
import { ClocksController } from './clocks.controller';

@Module({
  controllers: [ClocksController],
  providers: [ClocksService],
})
export class ClocksModule {}
