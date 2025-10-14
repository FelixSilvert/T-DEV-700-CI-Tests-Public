// src/modules/users/users.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Clock } from "../clocks/entities/clock.entity";
import { UsersController } from "./users.controller";
import { UserValidationService } from "./services/user-validation.service";
import { UserSecurityService } from "./services/user-security.service";
import { UsersService } from "./users.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, Clock])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserValidationService,
    UserSecurityService,
  ],
  exports: [UsersService],
})
export class UsersModule {}