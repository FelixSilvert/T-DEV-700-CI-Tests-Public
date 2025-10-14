import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";

interface TimeValidation {
  arrivalTime: string;
  departureTime: string;
}

@Injectable()
export class UserValidationService {
  private static readonly MIN_WORK_DURATION_MINUTES = 240; // 4 heures
  private static readonly MIN_LUNCH_BREAK_MINUTES = 15;
  private static readonly MAX_LUNCH_BREAK_MINUTES = 180;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Vérifie l'unicité de l'email
   */
  async validateEmailUniqueness(email: string, excludeUserId?: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    
    if (existingUser && existingUser.id !== excludeUserId) {
      throw new ConflictException("Email already in use");
    }
  }

  /**
   * Vérifie l'unicité du numéro de téléphone
   */
  async validatePhoneUniqueness(phoneNumber: string, excludeUserId?: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({ where: { phoneNumber } });
    
    if (existingUser && existingUser.id !== excludeUserId) {
      throw new ConflictException("Phone number already in use");
    }
  }

  /**
   * Valide les horaires de travail
   */
  validateWorkingHours(validation: TimeValidation): void {
    const arrivalMinutes = this.convertTimeToMinutes(validation.arrivalTime);
    const departureMinutes = this.convertTimeToMinutes(validation.departureTime);

    this.validateArrivalBeforeDeparture(arrivalMinutes, departureMinutes);
    this.validateMinimumWorkDuration(arrivalMinutes, departureMinutes);
  }

  /**
   * Valide la durée de la pause déjeuner
   */
  validateLunchBreakDuration(duration: number): void {
    if (duration < UserValidationService.MIN_LUNCH_BREAK_MINUTES) {
      throw new BadRequestException(
        `Lunch break duration must be at least ${UserValidationService.MIN_LUNCH_BREAK_MINUTES} minutes`
      );
    }

    if (duration > UserValidationService.MAX_LUNCH_BREAK_MINUTES) {
      throw new BadRequestException(
        `Lunch break duration must not exceed ${UserValidationService.MAX_LUNCH_BREAK_MINUTES} minutes`
      );
    }
  }

  /**
   * Convertit une heure au format HH:mm en minutes
   */
  private convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Vérifie que l'arrivée est avant le départ
   */
  private validateArrivalBeforeDeparture(arrivalMinutes: number, departureMinutes: number): void {
    if (arrivalMinutes >= departureMinutes) {
      throw new BadRequestException(
        "Expected arrival time must be before expected departure time"
      );
    }
  }

  /**
   * Vérifie la durée minimale de travail
   */
  private validateMinimumWorkDuration(arrivalMinutes: number, departureMinutes: number): void {
    const workDuration = departureMinutes - arrivalMinutes;
    
    if (workDuration < UserValidationService.MIN_WORK_DURATION_MINUTES) {
      throw new BadRequestException(
        `Work duration must be at least ${UserValidationService.MIN_WORK_DURATION_MINUTES / 60} hours`
      );
    }
  }
}