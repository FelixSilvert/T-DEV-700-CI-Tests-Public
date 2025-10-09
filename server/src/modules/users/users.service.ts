import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly UserRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { email, password, phoneNumber, ...rest } = createUserDto;

      const existingMail = await this.UserRepository.findOne({
        where: { email },
      });
      if (existingMail) {
        throw new ConflictException("Email already in use");
      }

      const existingPhoneNumber = await this.UserRepository.findOne({
        where: { phoneNumber },
      });
      if (existingPhoneNumber) {
        throw new ConflictException("PhoneNumber already in use");
      }

      const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = this.UserRepository.create({
        email,
        password: hashedPassword,
        phoneNumber,
        ...rest,
      });

      await this.UserRepository.save(newUser);

      return {
        message: "User created successfully",
      };
    } catch (error) {
      this.logger.error("Error creating user:", error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        "An unexpected error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const users = await this.UserRepository.find();

      if (!users)
        throw new HttpException("No users found", HttpStatus.NOT_FOUND);

      return users;
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.UserRepository.findOne({
        where: { id: id },
      });

      if (!user)
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);

      return user;
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllByIDTeam(id: string) {
    try {
      const users = await this.UserRepository.find({
        where: { team: { id } },
      });

      if (!users)
        throw new HttpException("No users found", HttpStatus.NOT_FOUND);

      return users;
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const { email, password, phoneNumber, ...rest } = updateUserDto;

      const user = await this.UserRepository.findOne({ where: { id } });
      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      if (email && email !== user.email) {
        const existingMail = await this.UserRepository.findOne({
          where: { email },
        });

        if (existingMail) {
          throw new ConflictException("Email already in use");
        }
        user.email = email;
      }

      if (phoneNumber && phoneNumber !== user.phoneNumber) {
        const existingPhoneNumber = await this.UserRepository.findOne({
          where: { phoneNumber },
        });

        if (existingPhoneNumber) {
          throw new ConflictException("PhoneNumber already in use");
        }
        user.phoneNumber = phoneNumber;
      }

      if (password) {
        const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
        user.password = await bcrypt.hash(password, saltRounds);
      }

      Object.assign(user, rest);

      await this.UserRepository.save(user);

      return {
        message: "User updated successfully",
      };
    } catch (error) {
      this.logger.error("Error updating user: ", error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string) {
    try {
      const user = await this.UserRepository.findOne({
        where: { id: id },
      });

      if (!user)
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);

      await this.UserRepository.delete(id);

      return {
        message: "User deleted successfully",
      };
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
