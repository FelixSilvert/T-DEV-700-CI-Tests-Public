import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { Repository } from "typeorm";
import { Team } from "./entities/team.entity";

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team)
    private readonly TeamRepository: Repository<Team>,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    try {
      const newTeam = this.TeamRepository.create({
        ...createTeamDto,
      });

      await this.TeamRepository.save(newTeam);

      return {
        message: "Team created",
      };
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const teams = await this.TeamRepository.find();

      if (!teams)
        throw new HttpException("No teams found", HttpStatus.NOT_FOUND);

      return teams;
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const team = await this.TeamRepository.findOne({
        where: { id: id },
      });

      if (!team)
        throw new HttpException("Team not found", HttpStatus.NOT_FOUND);

      return team;
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    try {
      const team = await this.TeamRepository.findOne({
        where: { id: id },
      });

      if (!team)
        throw new HttpException("Team not found", HttpStatus.NOT_FOUND);

      Object.assign(team, updateTeamDto);

      await this.TeamRepository.save(team);

      return {
        message: "Team updated successfully",
      };
    } catch (error) {
      this.logger.log("error : " + error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string) {
    try {
      const team = await this.TeamRepository.findOne({
        where: { id: id },
      });

      if (!team)
        throw new HttpException("Team not found", HttpStatus.NOT_FOUND);

      await this.TeamRepository.delete(id);

      return {
        message: "Team deleted successfully",
      };
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
