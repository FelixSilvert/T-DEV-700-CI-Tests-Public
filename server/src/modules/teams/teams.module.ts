import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Team } from "./entities/team.entity";
import { TeamsService } from "./teams.service";
import { User } from "../users/entities/user.entity";
import { TeamsController } from "./teams.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Team, User])],

  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
