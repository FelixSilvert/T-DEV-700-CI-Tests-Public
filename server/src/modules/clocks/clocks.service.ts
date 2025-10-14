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
import { Repository, Between, FindOptionsWhere } from "typeorm";
import { Clock, ClockType } from "./entities/clock.entity";
import { CreateClockDto } from "./dto/create-clock.dto";
import { UpdateClockDto } from "./dto/update-clock.dto";
import { QueryClocksDto } from "./dto/query-clocks.dto";
import { User } from "../users/entities/user.entity";

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

      // Valider la cohérence du pointage
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
  async findAll(queryDto: QueryClocksDto): Promise<Clock[]> {
    try {
      const { userId, teamId, type, from, to } = queryDto;

      const whereConditions: FindOptionsWhere<Clock> = {};

      // Filtrer par utilisateur
      if (userId) {
        whereConditions.IDUser = userId;
      }

      // Filtrer par type de clock
      if (type) {
        whereConditions.type = type;
      }

      // Filtrer par plage de dates
      if (from && to) {
        whereConditions.timestamp = Between(new Date(from), new Date(to));
      } else if (from) {
        whereConditions.timestamp = Between(new Date(from), new Date());
      }

      let query = this.clockRepository
        .createQueryBuilder("clock")
        .leftJoinAndSelect("clock.user", "user");

      // Filtrer par équipe si nécessaire
      if (teamId) {
        query = query.where("user.teamId = :teamId", { teamId });
      }

      // Appliquer les autres conditions
      if (userId) {
        query = query.andWhere("clock.IDUser = :userId", { userId });
      }
      if (type) {
        query = query.andWhere("clock.type = :type", { type });
      }
      if (from && to) {
        query = query.andWhere("clock.timestamp BETWEEN :from AND :to", { from, to });
      } else if (from) {
        query = query.andWhere("clock.timestamp >= :from", { from });
      }

      const clocks = await query.orderBy("clock.timestamp", "DESC").getMany();

      if (!clocks || clocks.length === 0) {
        throw new NotFoundException("No clocks found matching the criteria");
      }

      return clocks;
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

  /**
   * Récupère tous les clocks d'un utilisateur
   */
  async findByUser(userId: string): Promise<Clock[]> {
    try {
      const userExists = await this.userRepository.exists({ where: { id: userId } });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const clocks = await this.clockRepository.find({
        where: { IDUser: userId },
        order: { timestamp: "DESC" },
      });

      if (!clocks || clocks.length === 0) {
        throw new NotFoundException(`No clocks found for user ${userId}`);
      }

      return clocks;
    } catch (error) {
      this.logger.error("Error fetching user clocks:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupère les clocks du jour pour un utilisateur
   */
  async findTodayClocks(userId: string): Promise<Clock[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const clocks = await this.clockRepository.find({
        where: {
          IDUser: userId,
          timestamp: Between(today, tomorrow),
        },
        order: { timestamp: "ASC" },
      });

      return clocks;
    } catch (error) {
      this.logger.error("Error fetching today's clocks:", error);
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
    const todayClocks = await this.findTodayClocks(userId);

    // Vérifier l'unicité du type pour aujourd'hui
    this.checkDuplicateClockType(todayClocks, type);

    // Valider selon le type de clock
    this.validateClockTypeRules(todayClocks, type);

    // Valider l'ordre chronologique des timestamps
    this.validateClockTimestamps(todayClocks, type, timestamp);
  }

  /**
   * Vérifie qu'il n'existe pas déjà un clock du même type aujourd'hui
   */
  private checkDuplicateClockType(todayClocks: Clock[], type: ClockType): void {
    const existingSameType = todayClocks.find(c => c.type === type);
    if (existingSameType) {
      throw new ConflictException(`A ${type} clock already exists for today`);
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

  /**
   * Calcule les heures travaillées pour un utilisateur sur une période
   */
  async calculateWorkedHours(userId: string, from: Date, to: Date): Promise<number> {
    try {
      const clocks = await this.clockRepository.find({
        where: {
          IDUser: userId,
          timestamp: Between(from, to),
        },
        order: { timestamp: "ASC" },
      });

      // Grouper par jour
      const clocksByDay = this.groupClocksByDay(clocks);

      let totalMinutes = 0;

      for (const [, dayClocks] of Object.entries(clocksByDay)) {
        const arrival = dayClocks.find(c => c.type === ClockType.ARRIVAL);
        const lunchStart = dayClocks.find(c => c.type === ClockType.LUNCH_START);
        const lunchEnd = dayClocks.find(c => c.type === ClockType.LUNCH_END);
        const departure = dayClocks.find(c => c.type === ClockType.DEPARTURE);

        if (!arrival || !departure) continue;

        // Temps total entre arrivée et départ
        let dayMinutes = (departure.timestamp.getTime() - arrival.timestamp.getTime()) / 1000 / 60;

        // Soustraire la pause déjeuner si complète
        if (lunchStart && lunchEnd) {
          const lunchMinutes = (lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime()) / 1000 / 60;
          dayMinutes -= lunchMinutes;
        }

        totalMinutes += dayMinutes;
      }

      return Math.round(totalMinutes / 60 * 100) / 100; // Heures avec 2 décimales
    } catch (error) {
      this.logger.error("Error calculating worked hours:", error);
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Groupe les clocks par jour
   */
  private groupClocksByDay(clocks: Clock[]): Record<string, Clock[]> {
    return clocks.reduce((acc, clock) => {
      const dateKey = clock.timestamp.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(clock);
      return acc;
    }, {} as Record<string, Clock[]>);
  }
}