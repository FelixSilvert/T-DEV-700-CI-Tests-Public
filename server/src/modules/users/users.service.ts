import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { Clock } from "../clocks/entities/clock.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserRole } from "./entities/user.entity";
import { UserSecurityService } from "./services/user-security.service";
import { UserValidationService } from "./services/user-validation.service";
import { CreateUserResult, UpdateUserResult, MessageResult } from "./types/user.types";

interface CreateUserOptions {
  allowPrivilegedRole?: boolean;
}


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds: number;
  private readonly userSelectFields = this.getUserSelectFields();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Clock)
    private readonly clockRepository: Repository<Clock>,
    private readonly validationService: UserValidationService,
    private readonly securityService: UserSecurityService,
  ) {
    this.saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  }

  /**
   * Crée un nouvel utilisateur
   */
  async create(
    createUserDto: CreateUserDto,
    requestUser?: User,
    options: CreateUserOptions = {},
  ): Promise<CreateUserResult> {
    try {
      await this.validateNewUser(createUserDto);
      
      const userData = this.prepareUserDataWithoutPassword(createUserDto, requestUser, options);
      const newUser = await this.saveNewUser({ ...userData, password: createUserDto.password });

      this.logger.log(`User created: ${newUser.email} (${newUser.id})`);

      return {
        message: "User created successfully",
        user: this.sanitizeUser(newUser),
      };
    } catch (error) {
      return this.handleError("Error creating user", error);
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestUser?: User,
  ): Promise<UpdateUserResult> {
    try {
      this.securityService.canUpdateProfile(id, requestUser);

      const user = await this.findUserById(id);
      await this.validateUserUpdate(updateUserDto, user);
      
      this.applyUserUpdates(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);

      this.logger.log(`User updated: ${updatedUser.email} (${updatedUser.id})`);

      return {
        message: "User updated successfully",
        user: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      return this.handleError("Error updating user", error);
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   */
  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
    requestUser?: User,
  ): Promise<MessageResult> {
    try {
      this.securityService.canChangePassword(id, requestUser);

      const user = await this.findUserWithPassword(id);
      await this.validatePasswordUpdate(user, updatePasswordDto);
      
      user.password = await this.hashPassword(updatePasswordDto.newPassword);
      await this.userRepository.save(user);

      this.logger.log(`Password updated for user ${id}`);

      return { message: "Password updated successfully" };
    } catch (error) {
      return this.handleError("Error updating password", error);
    }
  }

  /**
   * Supprime un utilisateur
   */
  async delete(id: string, requestUser?: User): Promise<MessageResult> {
    try {
      const user = await this.findUserById(id);
      this.securityService.canDeleteUser(user, requestUser);

      await this.userRepository.delete(id);

      this.logger.log(`User deleted: ${user.email} (${id})`);

      return { message: "User deleted successfully" };
    } catch (error) {
      return this.handleError("Error deleting user", error);
    }
  }

  /**
   * Met à jour le rôle d'un utilisateur
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<UpdateUserResult> {
    try {
      const user = await this.findUserById(id);
      user.role = updateRoleDto.role;
      
      const updatedUser = await this.userRepository.save(user);

      this.logger.log(`Role updated for user ${updatedUser.email}: ${updateRoleDto.role}`);

      return {
        message: "User role updated successfully",
        user: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      return this.handleError("Error updating user role", error);
    }
  }

  /**
   * Récupère tous les utilisateurs
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await this.userRepository.find({
        select: this.userSelectFields,
      });

      if (!users || users.length === 0) {
        throw new NotFoundException("No users found");
      }

      return users;
    } catch (error) {
      return this.handleError("Error fetching users", error);
    }
  }

  /**
   * Récupère un utilisateur par ID
   */
  async findOne(id: string): Promise<User> {
    try {
      const user = await this.findUserById(id);
      return user;
    } catch (error) {
      return this.handleError("Error fetching user", error);
    }
  }

  /**
   * Récupère tous les utilisateurs d'une équipe
   */
  async findAllByTeamId(teamId: string): Promise<User[]> {
    try {
      const users = await this.userRepository.find({
        where: { IDTeam: teamId },
        select: this.userSelectFields,
      });

      if (!users || users.length === 0) {
        throw new NotFoundException(`No users found in team ${teamId}`);
      }

      return users;
    } catch (error) {
      return this.handleError("Error fetching users by team", error);
    }
  }

  /**
   * Récupère un utilisateur par email
   */
  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      
      if (!user) {
        throw new NotFoundException("User not found");
      }
      
      return user;
    } catch (error) {
      return this.handleError("Error fetching user by email", error);
    }
  }

  /**
   * Récupère tous les clocks d'un utilisateur
   */
  async findUserClocks(userId: string): Promise<Clock[]> {
    try {
      const clocks = await this.clockRepository.find({
        where: { IDUser: userId },
        order: { timestamp: "DESC" },
      });

      if (!clocks || clocks.length === 0) {
        throw new NotFoundException(`No clocks found for user ${userId}`);
      }

      return clocks;
    } catch (error) {
      return this.handleError("Error fetching clocks", error);
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Valide un nouvel utilisateur
   */
  private async validateNewUser(dto: CreateUserDto): Promise<void> {
    await this.validationService.validateEmailUniqueness(dto.email);
    await this.validationService.validatePhoneUniqueness(dto.phoneNumber);

    if (dto.expectedArrivalTime && dto.expectedDepartureTime) {
      this.validationService.validateWorkingHours({
        arrivalTime: dto.expectedArrivalTime,
        departureTime: dto.expectedDepartureTime,
      });
    }

    if (dto.lunchBreakDuration !== undefined) {
      this.validationService.validateLunchBreakDuration(dto.lunchBreakDuration);
    }
  }

  /**
   * Prépare les données pour créer un utilisateur (sans le password)
   */
  private prepareUserDataWithoutPassword(
    dto: CreateUserDto,
    requestUser?: User,
    options: CreateUserOptions = {},
  ): Omit<CreateUserDto, 'password'> {
    const {
      password, 
      role,
      expectedArrivalTime = "09:00",
      expectedDepartureTime = "17:00",
      lunchBreakDuration = 60,
      ...rest
    } = dto;

    let assignedRole = UserRole.USER;

    if (options.allowPrivilegedRole) {
      assignedRole = role ?? UserRole.USER;
    } else if (role) {
      assignedRole = this.securityService.determineAssignableRole(role, requestUser);
    }

    return {
      ...rest,
      role: assignedRole,
      expectedArrivalTime,
      expectedDepartureTime,
      lunchBreakDuration,
    };
  }

  /**
   * Sauvegarde un nouvel utilisateur
   */
  private async saveNewUser(userData: Partial<User> & { password: string }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const newUser = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }

  /**
   * Valide une mise à jour d'utilisateur
   */
  private async validateUserUpdate(dto: UpdateUserDto, currentUser: User): Promise<void> {
    if (dto.email) {
      await this.validationService.validateEmailUniqueness(dto.email, currentUser.id);
    }

    if (dto.phoneNumber) {
      await this.validationService.validatePhoneUniqueness(dto.phoneNumber, currentUser.id);
    }

    if (dto.expectedArrivalTime || dto.expectedDepartureTime) {
      const arrivalTime = dto.expectedArrivalTime || currentUser.expectedArrivalTime;
      const departureTime = dto.expectedDepartureTime || currentUser.expectedDepartureTime;

      this.validationService.validateWorkingHours({
        arrivalTime,
        departureTime,
      });
    }

    if (dto.lunchBreakDuration !== undefined) {
      this.validationService.validateLunchBreakDuration(dto.lunchBreakDuration);
    }
  }

  /**
   * Applique les modifications à un utilisateur
   */
  private applyUserUpdates(user: User, dto: UpdateUserDto): void {
    const { email, phoneNumber, expectedArrivalTime, expectedDepartureTime, ...rest } = dto;

    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (expectedArrivalTime) user.expectedArrivalTime = expectedArrivalTime;
    if (expectedDepartureTime) user.expectedDepartureTime = expectedDepartureTime;

    Object.assign(user, rest);
  }

  /**
   * Valide une mise à jour de mot de passe
   */
  private async validatePasswordUpdate(
    user: User,
    dto: UpdatePasswordDto,
  ): Promise<void> {
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from current password"
      );
    }
  }

  /**
   * Récupère un utilisateur par ID
   */
  private async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: this.userSelectFields,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Récupère un utilisateur avec son mot de passe
   */
  private async findUserWithPassword(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ["id", "password"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Hash un mot de passe
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Retire le mot de passe d'un utilisateur
   */
  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Définit les champs à sélectionner pour un utilisateur
   */
  private getUserSelectFields() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      role: true,
      IDTeam: true,
      expectedArrivalTime: true,
      expectedDepartureTime: true,
      lunchBreakDuration: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  /**
   * Gère les erreurs de manière centralisée
   */
  private handleError(context: string, error: unknown): never {
    this.logger.error(context, error);
    if (error instanceof HttpException) throw error;
    if (error instanceof Error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
  }
}