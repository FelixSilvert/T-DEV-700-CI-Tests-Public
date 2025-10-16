import { Logger } from "@nestjs/common";
import { QueryFailedError, Repository } from "typeorm";
import { UsersService } from "../../users/users.service";
import { User, UserRole } from "../../users/entities/user.entity";
import { SafeUser } from "../../users/types/user.types";

interface AdminConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  expectedArrivalTime: string;
  expectedDepartureTime: string;
  lunchBreakDuration: number;
}

export class AdminSeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger,
  ) {}

  async ensureAdmin(): Promise<SafeUser> {
    const config = this.getAdminConfig();
    this.logger.log(`Ensuring admin user exists (${config.email})`);

    const existing = await this.findAdminByEmail(config.email);
    if (existing) {
      this.logger.warn(`Admin already exists (${existing.email}), updating schedule if needed.`);
      await this.userRepository.update(existing.id, {
        expectedArrivalTime: config.expectedArrivalTime,
        expectedDepartureTime: config.expectedDepartureTime,
        lunchBreakDuration: config.lunchBreakDuration,
        phoneNumber: config.phoneNumber,
        firstName: config.firstName,
        lastName: config.lastName,
      });

      const refreshed = await this.findAdminById(existing.id);
      if (refreshed) {
        return refreshed;
      }
      return existing;
    }

    this.logger.warn("Admin not found, creating a new one.");
    const adminDto = {
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      phoneNumber: config.phoneNumber,
      password: config.password,
      role: UserRole.ADMIN,
      IDTeam: null,
      expectedArrivalTime: config.expectedArrivalTime,
      expectedDepartureTime: config.expectedDepartureTime,
      lunchBreakDuration: config.lunchBreakDuration,
    };

    try {
      const result = await this.usersService.create(adminDto, undefined, { allowPrivilegedRole: true });
      this.logger.log(`Admin created (${result.user.email})`);
      return result.user;
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === "23505") {
        this.logger.warn("Admin creation hit existing unique constraint, returning current record.");
        const fallback = await this.findAdminByEmail(config.email);
        if (fallback) {
          return fallback;
        }
      }
      throw error;
    }
  }

  private async findAdminByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user ? this.sanitizeUser(user) : null;
  }

  private async findAdminById(id: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.sanitizeUser(user) : null;
  }

  private getAdminConfig(): AdminConfig {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";
    const adminLastName = process.env.ADMIN_LAST_NAME || "System";
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || "+33600000000";

    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined in environment variables");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      throw new Error(`Invalid ADMIN_EMAIL format: ${adminEmail}`);
    }

    if (adminPassword.length < 8) {
      throw new Error("ADMIN_PASSWORD must be at least 8 characters long");
    }

    return {
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhoneNumber,
      expectedArrivalTime: process.env.ADMIN_ARRIVAL_TIME || "09:00",
      expectedDepartureTime: process.env.ADMIN_DEPARTURE_TIME || "17:00",
      lunchBreakDuration: parseInt(process.env.ADMIN_LUNCH_DURATION || "60", 10),
    };
  }

  private sanitizeUser(user: User): SafeUser {
    const { password: _password, ...safe } = user;
    return safe;
  }
}
