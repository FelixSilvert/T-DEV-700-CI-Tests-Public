import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { loggerConfig } from "./config/logger.config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./modules/database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClocksModule } from "./modules/clocks/clocks.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { join } from "node:path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, "..", ".env")],
    }),
    LoggerModule.forRootAsync(loggerConfig),
    DatabaseModule,
    UsersModule,
    TeamsModule,
    AuthModule,
    ClocksModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
