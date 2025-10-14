import { NestFactory } from "@nestjs/core";
import { HttpException, HttpStatus, Logger, INestApplicationContext } from "@nestjs/common";
import { AppModule } from "../../app.module";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User, UserRole } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

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
): Promise<void> {
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
}

/**
 * Seed principal
 */
async function seedAdminUser(usersService: UsersService, logger: Logger): Promise<void> {
  try {
    const config = getAdminConfig();

    logger.log(`Checking if admin user exists: ${config.email}`);

    // Vérifier si l'admin existe déjà
    const existing = await checkAdminExists(usersService, config.email);

    if (existing) {
      logger.warn(`Admin user already exists: ${config.email}`);
      logger.warn(`   - ID: ${existing.id}`);
      logger.warn(`   - Role: ${existing.role}`);
      logger.warn(`   - Created: ${existing.createdAt}`);
      return;
    }

    // Créer l'admin
    logger.log(`Creating admin user: ${config.email}`);
    await createAdminUser(usersService, config, logger);

  } catch (error) {
    logger.error("Error during admin seeding:", error);
    throw error;
  }
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

    // Récupérer le service users
    const usersService = app.get(UsersService);

    // Lancer le seeding
    await seedAdminUser(usersService, logger);

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