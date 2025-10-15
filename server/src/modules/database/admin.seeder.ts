import { NestFactory } from "@nestjs/core";
import { HttpException, HttpStatus, Logger, INestApplicationContext } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { AppModule } from "../../app.module";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User, UserRole } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { Clock, ClockType } from "../clocks/entities/clock.entity";

/**
 * Configuration de l'admin par défaut
 */
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

type ClockProfileSource = Pick<
  User,
  "id" | "expectedArrivalTime" | "expectedDepartureTime" | "lunchBreakDuration"
>;

interface PreviousMonthRange {
  startDay: Date;
  endDay: Date;
  endBoundary: Date;
  totalDays: number;
}

/**
 * Récupère la configuration de l'admin depuis les variables d'environnement
 */
function getAdminConfig(): AdminConfig {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";
  const adminLastName = process.env.ADMIN_LAST_NAME || "System";
  const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || "+33600000000";

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be defined in environment variables"
    );
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

/**
 * Vérifie si l'admin existe déjà
 */
async function checkAdminExists(
  usersService: UsersService,
  email: string,
): Promise<User | null> {
  try {
    const existing = await usersService.findByEmail(email);
    return existing;
  } catch (error) {
    if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

/**
 * Crée l'utilisateur admin
 */
async function createAdminUser(
  usersService: UsersService,
  config: AdminConfig,
  logger: Logger,
): Promise<ClockProfileSource> {
  const createAdminDto: CreateUserDto = {
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

  const result = await usersService.create(createAdminDto, undefined, { allowPrivilegedRole: true });

  logger.log(`Admin user created successfully:`);
  logger.log(`   - Email: ${config.email}`);
  logger.log(`   - Name: ${config.firstName} ${config.lastName}`);
  logger.log(`   - Phone: ${config.phoneNumber}`);
  logger.log(`   - Working Hours: ${config.expectedArrivalTime} - ${config.expectedDepartureTime}`);
  logger.log(`   - Lunch Break: ${config.lunchBreakDuration} minutes`);
  logger.log(`   - ID: ${result.user.id}`);

  return {
    id: result.user.id,
    expectedArrivalTime: result.user.expectedArrivalTime,
    expectedDepartureTime: result.user.expectedDepartureTime,
    lunchBreakDuration: result.user.lunchBreakDuration,
  };
}

/**
 * Seed principal
 */
async function seedAdminUser(
  usersService: UsersService,
  clockRepository: Repository<Clock>,
  logger: Logger,
): Promise<void> {
  try {
    const config = getAdminConfig();

    logger.log(`Checking if admin user exists: ${config.email}`);

    // Vérifier si l'admin existe déjà
    const existing = await checkAdminExists(usersService, config.email);

    let adminProfile: ClockProfileSource;

    if (existing) {
      logger.warn(`Admin user already exists: ${config.email}`);
      logger.warn(`   - ID: ${existing.id}`);
      logger.warn(`   - Role: ${existing.role}`);
      logger.warn(`   - Created: ${existing.createdAt}`);
      adminProfile = existing;
    } else {
      // Créer l'admin
      logger.log(`Creating admin user: ${config.email}`);
      adminProfile = await createAdminUser(usersService, config, logger);
    }

    await seedAdminClocks(adminProfile, config, clockRepository, logger);

  } catch (error) {
    logger.error("Error during admin seeding:", error);
    throw error;
  }
}

async function seedAdminClocks(
  admin: ClockProfileSource,
  config: AdminConfig,
  clockRepository: Repository<Clock>,
  logger: Logger,
): Promise<void> {
  if (!admin?.id) {
    logger.warn("Cannot seed clocks for admin: missing identifier");
    return;
  }

  const { startDay, endBoundary, totalDays } = getPreviousMonthRange();

  const existingCount = await clockRepository.count({
    where: {
      IDUser: admin.id,
      timestamp: Between(startDay, endBoundary),
    },
  });

  if (existingCount > 0) {
    logger.warn(
      `Skipping admin clock generation: ${existingCount} clocks already exist for the previous month.`,
    );
    return;
  }

  const schedule = resolveSchedule(admin, config);
  const clocks: Clock[] = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDay = new Date(
      Date.UTC(
        startDay.getUTCFullYear(),
        startDay.getUTCMonth(),
        startDay.getUTCDate() + dayIndex,
        0,
        0,
        0,
        0,
      ),
    );

    const arrivalDelay = randomInt(0, 25);
    const arrivalMinutes = schedule.arrivalMinutes + arrivalDelay;

    const lunchDuration = clampMinutes(schedule.lunchMinutes + randomInt(-15, 30), 30, 120);
    const lunchStartShift = randomInt(-10, 15);
    const baseLunchStart = schedule.arrivalMinutes + Math.round(3.5 * 60);
    const earliestLunchStart = arrivalMinutes + 150;
    const latestLunchStartCandidate = schedule.departureMinutes - (lunchDuration + 150);
    const latestLunchStart = Math.max(earliestLunchStart, latestLunchStartCandidate);
    const lunchStartMinutes = clampMinutes(
      baseLunchStart + lunchStartShift,
      earliestLunchStart,
      latestLunchStart,
    );
    const lunchEndMinutes = lunchStartMinutes + lunchDuration;

    const departureShift = randomInt(-20, 40);
    const earliestDeparture = lunchEndMinutes + 150;
    const latestDeparture = Math.min(
      Math.max(earliestDeparture, schedule.departureMinutes + 60),
      23 * 60 + 30,
    );
    const departureMinutes = clampMinutes(
      schedule.departureMinutes + departureShift,
      earliestDeparture,
      latestDeparture,
    );

    clocks.push(
      clockRepository.create({
        IDUser: admin.id,
        type: ClockType.ARRIVAL,
        timestamp: buildUtcDate(currentDay, arrivalMinutes),
      }),
      clockRepository.create({
        IDUser: admin.id,
        type: ClockType.LUNCH_START,
        timestamp: buildUtcDate(currentDay, lunchStartMinutes),
      }),
      clockRepository.create({
        IDUser: admin.id,
        type: ClockType.LUNCH_END,
        timestamp: buildUtcDate(currentDay, lunchEndMinutes),
      }),
      clockRepository.create({
        IDUser: admin.id,
        type: ClockType.DEPARTURE,
        timestamp: buildUtcDate(currentDay, departureMinutes),
      }),
    );
  }

  if (clocks.length === 0) {
    logger.warn("No admin clocks generated for the previous month.");
    return;
  }

  await clockRepository.save(clocks);

  logger.log(
    `Generated ${clocks.length} admin clocks covering ${totalDays} day(s) for ${formatMonthIdentifier(
      startDay,
    )}.`,
  );
}

function resolveSchedule(admin: ClockProfileSource, config: AdminConfig) {
  return {
    arrivalMinutes: parseTimeOrDefault(admin.expectedArrivalTime, config.expectedArrivalTime),
    departureMinutes: parseTimeOrDefault(admin.expectedDepartureTime, config.expectedDepartureTime),
    lunchMinutes: admin.lunchBreakDuration ?? config.lunchBreakDuration,
  };
}

function getPreviousMonthRange(): PreviousMonthRange {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  const startDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endBoundary = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);
  const totalDays = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0)).getUTCDate();

  return { startDay, endDay: new Date(Date.UTC(year, month, 0, 0, 0, 0, 0)), endBoundary, totalDays };
}

function parseTimeOrDefault(value: string | null | undefined, fallback: string): number {
  const source = value ?? fallback;
  const [hoursStr, minutesStr] = source.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    const [fallbackHours, fallbackMinutes] = fallback.split(":").map(Number);
    return fallbackHours * 60 + fallbackMinutes;
  }

  return hours * 60 + minutes;
}

function clampMinutes(value: number, min: number, max: number): number {
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  const roundedValue = Math.round(value);

  if (roundedMin > roundedMax) {
    return roundedMin;
  }

  return Math.min(Math.max(roundedValue, roundedMin), roundedMax);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildUtcDate(day: Date, minutesFromMidnight: number): Date {
  return new Date(day.getTime() + minutesFromMidnight * 60_000);
}

function formatMonthIdentifier(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Bootstrap principal
 */
async function bootstrap() {
  const logger = new Logger("AdminSeeder");
  
  logger.log("=".repeat(60));
  logger.log("Starting Admin User Seeder");
  logger.log("=".repeat(60));

  let app: INestApplicationContext | undefined;

  try {
    // Créer le contexte de l'application
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ["error", "warn", "log"],
    });

    // Récupérer les services nécessaires
    const usersService = app.get(UsersService);
    const clockRepository = app.get<Repository<Clock>>(getRepositoryToken(Clock));

    // Lancer le seeding
    await seedAdminUser(usersService, clockRepository, logger);

    logger.log("=".repeat(60));
    logger.log("Admin seeding completed successfully");
    logger.log("=".repeat(60));

  } catch (error) {
    logger.error("=".repeat(60));
    logger.error("Admin seeding failed");
    logger.error("=".repeat(60));
    logger.error(error);
    process.exit(1);
  } finally {
    // Fermer proprement l'application
    if (app) {
      await app.close();
      logger.log("Application context closed");
    }
  }
}

// Exécuter le seeder
bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});