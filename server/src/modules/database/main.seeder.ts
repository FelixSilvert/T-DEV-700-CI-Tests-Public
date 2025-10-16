import { NestFactory } from "@nestjs/core";
import { INestApplicationContext, Logger } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../../app.module";
import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { Team } from "../teams/entities/team.entity";
import { Clock } from "../clocks/entities/clock.entity";
import { DatabaseSeeder } from "./seeders/database.seeder";

async function bootstrap() {
  const logger = new Logger("DatabaseSeeder");
  logger.log("=".repeat(60));
  logger.log("Launching database seeder");
  logger.log("=".repeat(60));

  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ["error", "warn", "log"],
    });

    const usersService = app.get(UsersService);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const teamRepository = app.get<Repository<Team>>(getRepositoryToken(Team));
    const clockRepository = app.get<Repository<Clock>>(getRepositoryToken(Clock));

    const seeder = new DatabaseSeeder(
      usersService,
      userRepository,
      teamRepository,
      clockRepository,
      logger,
    );

    await seeder.run();

    logger.log("=".repeat(60));
    logger.log("Database seeding completed successfully");
    logger.log("=".repeat(60));
  } catch (error) {
    logger.error("=".repeat(60));
    logger.error("Database seeding failed");
    logger.error("=".repeat(60));
    logger.error(error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
      logger.log("Application context closed");
    }
  }
}

bootstrap().catch((error) => {
  console.error("Fatal error during bootstrap:", error);
  process.exit(1);
});
