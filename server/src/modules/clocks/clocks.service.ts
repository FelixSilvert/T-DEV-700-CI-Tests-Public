import {
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Clock, ClockType } from "./entities/clock.entity";
import { CreateClockDto } from "./dto/create-clock.dto";
import { UpdateClockDto } from "./dto/update-clock.dto";
import { QueryClocksDto } from "./dto/query-clocks.dto";
import { User } from "../users/entities/user.entity";
import { CursorPaginatedResponse } from "../../common/pagination/pagination.types";
import {
  buildCursorPaginatedResponse,
  decodeCursor,
  encodeCursor,
  getCursorLimit,
} from "../../common/pagination/pagination.utils";

@Injectable()
export class ClocksService {
  private readonly logger = new Logger(ClocksService.name);

  constructor(
    @InjectRepository(Clock)
    private readonly clockRepository: Repository<Clock>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crée un nouveau pointage
   * Valide la cohérence (pas de departure sans arrival, etc.)
   */
  async create(createClockDto: CreateClockDto): Promise<{ message: string; clock: Clock }> {
    try {
      const { IDUser, type, timestamp } = createClockDto;

      // Vérifier que l'utilisateur existe
      const userExists = await this.userRepository.exists({ where: { id: IDUser } });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${IDUser} not found`);
      }

      // Utiliser l'heure actuelle si non fournie
      const clockTimestamp = timestamp ? new Date(timestamp) : new Date();

      // Valider la cohérence du pointage sur la journée du timestamp fourni
      await this.validateClockConsistency(IDUser, type, clockTimestamp);

      const newClock = this.clockRepository.create({
        type,
        timestamp: clockTimestamp,
        IDUser,
      });

      const savedClock = await this.clockRepository.save(newClock);

      this.logger.log(`Clock created: ${type} for user ${IDUser} at ${clockTimestamp.toISOString()}`);

      return {
        message: "Clock created successfully",
        clock: savedClock,
      };
    } catch (error) {
      this.logger.error("Error creating clock:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupère les clocks avec filtres optionnels
   */
  async findAll(queryDto: QueryClocksDto): Promise<CursorPaginatedResponse<Clock>> {
    try {
      const { userId, teamId, type, from, to, cursor } = queryDto;
      const limit = getCursorLimit(queryDto);

      const baseQuery = this.clockRepository
        .createQueryBuilder("clock")
        .leftJoinAndSelect("clock.user", "user")
        .where("1 = 1")
        .orderBy("clock.timestamp", "DESC")
        .addOrderBy("clock.id", "DESC");

      if (teamId) {
        baseQuery.andWhere("user.\"IDTeam\" = :teamId", { teamId });
      }

      if (userId) {
        baseQuery.andWhere("clock.\"IDUser\" = :userId", { userId });
      }

      if (type) {
        baseQuery.andWhere("clock.type = :type", { type });
      }

      if (from && to) {
        baseQuery.andWhere("clock.timestamp BETWEEN :from AND :to", { from, to });
      } else if (from) {
        baseQuery.andWhere("clock.timestamp >= :from", { from });
      }

      if (cursor) {
        const { timestamp, id } = decodeCursor(cursor);
        baseQuery.andWhere(
          "(clock.timestamp < :cursorTimestamp OR (clock.timestamp = :cursorTimestamp AND clock.id < :cursorId))",
          { cursorTimestamp: timestamp.toISOString(), cursorId: id },
        );
      }

      const paginatedQuery = baseQuery.clone().take(limit + 1);
  const totalQuery = baseQuery.clone();

      const [clocks, total] = await Promise.all([
        paginatedQuery.getMany(),
        totalQuery.getCount(),
      ]);

      const hasExtra = clocks.length > limit;
      const data = hasExtra ? clocks.slice(0, limit) : clocks;

      const nextCursor = hasExtra
        ? encodeCursor({
            timestamp: data[data.length - 1].timestamp,
            id: data[data.length - 1].id,
          })
        : null;

      return buildCursorPaginatedResponse(data, total, limit, nextCursor);
    } catch (error) {
      this.logger.error("Error fetching clocks:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupère un clock par ID
   */
  async findOne(id: string): Promise<Clock> {
    try {
      const clock = await this.clockRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      if (!clock) {
        throw new NotFoundException(`Clock with ID ${id} not found`);
      }

      return clock;
    } catch (error) {
      this.logger.error("Error fetching clock:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async findClocksForDay(userId: string, referenceDate: Date): Promise<Clock[]> {
    const { startOfDay, endOfDay } = this.getDayBoundaries(referenceDate);

    return this.clockRepository.find({
      where: {
        IDUser: userId,
        timestamp: Between(startOfDay, endOfDay),
      },
      order: { timestamp: "ASC" },
    });
  }

  private getDayBoundaries(referenceDate: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return { startOfDay, endOfDay };
  }

  /**
   * Met à jour un clock
   */
  async update(id: string, updateClockDto: UpdateClockDto): Promise<{ message: string; clock: Clock }> {
    try {
      const clock = await this.findOne(id);

      if (updateClockDto.type) {
        clock.type = updateClockDto.type;
      }

      if (updateClockDto.timestamp) {
        clock.timestamp = new Date(updateClockDto.timestamp);
      }

      const updatedClock = await this.clockRepository.save(clock);

      this.logger.log(`Clock ${id} updated successfully`);

      return {
        message: "Clock updated successfully",
        clock: updatedClock,
      };
    } catch (error) {
      this.logger.error("Error updating clock:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Supprime un clock
   */
  async delete(id: string): Promise<{ message: string }> {
    try {
      const clock = await this.findOne(id);
      await this.clockRepository.remove(clock);

      this.logger.log(`Clock ${id} deleted successfully`);

      return { message: "Clock deleted successfully" };
    } catch (error) {
      this.logger.error("Error deleting clock:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Valide la cohérence du pointage
   * Vérifie les règles métier selon le type de clock
   */
  private async validateClockConsistency(userId: string, type: ClockType, timestamp: Date): Promise<void> {
    const dayClocks = await this.findClocksForDay(userId, timestamp);

    // Vérifier l'unicité du type pour cette journée
    this.checkDuplicateClockType(dayClocks, type);

    // Valider selon le type de clock
    this.validateClockTypeRules(dayClocks, type);

    // Valider l'ordre chronologique des timestamps
    this.validateClockTimestamps(dayClocks, type, timestamp);
  }

  /**
   * Vérifie qu'il n'existe pas déjà un clock du même type sur la journée
   */
  private checkDuplicateClockType(todayClocks: Clock[], type: ClockType): void {
    const existingSameType = todayClocks.find(c => c.type === type);
    if (existingSameType) {
      throw new ConflictException(`A ${type} clock already exists for this day`);
    }
  }

  /**
   * Valide les règles métier selon le type de clock
   */
  private validateClockTypeRules(todayClocks: Clock[], type: ClockType): void {
    const validators: Record<ClockType, () => void> = {
      [ClockType.ARRIVAL]: () => this.validateArrival(todayClocks),
      [ClockType.LUNCH_START]: () => this.validateLunchStart(todayClocks),
      [ClockType.LUNCH_END]: () => this.validateLunchEnd(todayClocks),
      [ClockType.DEPARTURE]: () => this.validateDeparture(todayClocks),
    };

    const validator = validators[type];
    if (validator) {
      validator();
    }
  }

  /**
   * Valide que ARRIVAL est le premier clock du jour
   */
  private validateArrival(todayClocks: Clock[]): void {
    if (todayClocks.length > 0) {
      throw new ConflictException("ARRIVAL must be the first clock of the day");
    }
  }

  /**
   * Valide que LUNCH_START nécessite un ARRIVAL préalable
   */
  private validateLunchStart(todayClocks: Clock[]): void {
    const hasArrival = todayClocks.some(c => c.type === ClockType.ARRIVAL);
    if (!hasArrival) {
      throw new ConflictException("Cannot register LUNCH_START without ARRIVAL");
    }
  }

  /**
   * Valide que LUNCH_END nécessite un LUNCH_START préalable
   */
  private validateLunchEnd(todayClocks: Clock[]): void {
    const hasLunchStart = todayClocks.some(c => c.type === ClockType.LUNCH_START);
    if (!hasLunchStart) {
      throw new ConflictException("Cannot register LUNCH_END without LUNCH_START");
    }
  }

  /**
   * Valide que DEPARTURE respecte toutes les conditions
   */
  private validateDeparture(todayClocks: Clock[]): void {
    const arrivalClock = todayClocks.find(c => c.type === ClockType.ARRIVAL);
    if (!arrivalClock) {
      throw new ConflictException("Cannot register DEPARTURE without ARRIVAL");
    }

    const lunchStartClock = todayClocks.find(c => c.type === ClockType.LUNCH_START);
    const lunchEndClock = todayClocks.find(c => c.type === ClockType.LUNCH_END);

    if (lunchStartClock && !lunchEndClock) {
      throw new ConflictException("Cannot register DEPARTURE: lunch break not finished");
    }
  }

  /**
   * Valide que le timestamp respecte l'ordre chronologique des clocks
   */
  private validateClockTimestamps(todayClocks: Clock[], type: ClockType, timestamp: Date): void {
    const currentOrder = this.getClockTypeOrder(type);

    for (const existingClock of todayClocks) {
      const existingOrder = this.getClockTypeOrder(existingClock.type);

      if (currentOrder < existingOrder) {
        this.validateTimestampBefore(type, timestamp, existingClock);
      } else if (currentOrder > existingOrder) {
        this.validateTimestampAfter(type, timestamp, existingClock);
      }
    }
  }

  /**
   * Valide qu'un timestamp est avant un autre clock
   */
  private validateTimestampBefore(type: ClockType, timestamp: Date, existingClock: Clock): void {
    if (timestamp > existingClock.timestamp) {
      throw new BadRequestException(
        `${type} timestamp must be before ${existingClock.type} (${existingClock.timestamp.toISOString()})`
      );
    }
  }

  /**
   * Valide qu'un timestamp est après un autre clock
   */
  private validateTimestampAfter(type: ClockType, timestamp: Date, existingClock: Clock): void {
    if (timestamp < existingClock.timestamp) {
      throw new BadRequestException(
        `${type} timestamp must be after ${existingClock.type} (${existingClock.timestamp.toISOString()})`
      );
    }
  }

  /**
   * Retourne l'ordre chronologique attendu des types de clocks
   */
  private getClockTypeOrder(type: ClockType): number {
    const order: Record<ClockType, number> = {
      [ClockType.ARRIVAL]: 1,
      [ClockType.LUNCH_START]: 2,
      [ClockType.LUNCH_END]: 3,
      [ClockType.DEPARTURE]: 4,
    };
    return order[type];
  }
}