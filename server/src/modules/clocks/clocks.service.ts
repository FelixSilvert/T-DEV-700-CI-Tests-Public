import { HttpException, HttpStatus, Logger, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Clock } from "./entities/clock.entity";
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
      const newClock = this.ClockRepository.create({ ...createClockDto });
      await this.ClockRepository.save(newClock);

      return { message: "Clock created" };
    } catch (error) {
      this.logger.error("Error creating clock:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "An unexpected error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
