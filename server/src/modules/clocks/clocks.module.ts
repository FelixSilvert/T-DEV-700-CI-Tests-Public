import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Clock } from "./entities/clock.entity";
import { ClocksService } from "./clocks.service";
import { ClocksController } from "./clocks.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Clock])],

  controllers: [ClocksController],
  providers: [ClocksService],
  exports: [ClocksService],
})
export class ClocksModule {}
