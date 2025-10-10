import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>("NODE_ENV") === "production";
        return {
          type: "postgres",
          host: config.get<string>("DB_HOST"),
          port: config.get<number>("DB_PORT"),
          username: config.get<string>("DB_USER"),
          password: config.get<string>("DB_PASSWORD"),
          database: config.get<string>("DB_DATABASE"),
          autoLoadEntities: true,
          synchronize: !isProduction,
          // SSL selon l'environnement
          ssl: isProduction
            ? { rejectUnauthorized: false } // Prod: SSL activé
            : false, // Dev: pas besoin de SSL
          logging: !isProduction ? ["query", "error"] : ["error"],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
