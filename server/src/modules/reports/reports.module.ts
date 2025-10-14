import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { User } from "../users/entities/user.entity";
import { Team } from "../teams/entities/team.entity";
import { Clock } from "../clocks/entities/clock.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, Clock])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}