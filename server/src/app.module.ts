import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./modules/database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClocksModule } from "./modules/clocks/clocks.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { join } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, "..", ".env")],
    }),
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
