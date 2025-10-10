import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./modules/database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClocksModule } from "./modules/clocks/clocks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    UsersModule,
    TeamsModule,
    AuthModule,
    ClocksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
