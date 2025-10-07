import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: "postgres",
          host: config.get("DB_HOST"),
          port: config.get("DB_PORT"),
          username: config.get("DB_USER"),
          password: config.get("DB_PASSWORD"),
          database: config.get("DB_DATABASE"),
          entities: [__dirname + "/../**/*.entity{.ts,.js}"],
          synchronize: true,
          ssl: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
