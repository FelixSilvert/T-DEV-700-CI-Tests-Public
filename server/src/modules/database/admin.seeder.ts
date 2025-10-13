import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { HttpException, HttpStatus } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { UserRole, User } from "../users/entities/user.entity";

async function seedAdminUser(usersService: UsersService) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans les variables d'environnement.");
    process.exit(1);
  }

  try {
    let existing: User | null = null;

    try {
      existing = await usersService.findByEmail(adminEmail);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        existing = null;
      } else {
        throw error; 
      }
    }

    if (existing) {
      console.log(`Admin ${adminEmail} already exists.`);
      return;
    }

    await usersService.create({
      firstName: "John",
      lastName: "Doe",
      email: adminEmail,
      phoneNumber: 611131455,
      password: adminPassword,
      role: UserRole.ADMIN,
      IDTeam: null,
    });

    console.log(`Admin ${adminEmail} created.`);
  } catch (err) {
    console.error("Error during admin seeding:", err);
    throw err;
  }
}

async function bootstrap() {
  console.log("Starting admin seeding...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  await seedAdminUser(usersService);

  await app.close();
  console.log("Seeding complete.");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
