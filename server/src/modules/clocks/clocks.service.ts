import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Clock } from "./entities/clock.entity";
import { Injectable } from "@nestjs/common";
import { CreateClockDto } from "./dto/create-clock.dto";

@Injectable()
export class ClocksService {
  private readonly logger = new Logger(ClocksService.name);

  constructor(
    @InjectRepository(Clock)
    private readonly ClockRepository: Repository<Clock>,
  ) {}

  async create(createClockDto: CreateClockDto) {
    try {
      const newClock = this.ClockRepository.create({
        ...createClockDto,
      });

      await this.ClockRepository.save(newClock);

      return {
        message: "Clock created",
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
