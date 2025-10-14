import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Clock } from "./entities/clock.entity";
import { User } from "../users/entities/user.entity";
import { ClocksService } from "./clocks.service";
import { ClocksController } from "./clocks.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Clock, User])],
  controllers: [ClocksController],
  providers: [ClocksService],
  exports: [ClocksService],
})
export class ClocksModule {}