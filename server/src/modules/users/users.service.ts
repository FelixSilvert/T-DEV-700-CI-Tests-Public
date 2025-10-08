import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
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
      const newUser = this.UserRepository.create({
        ...createUserDto,
      });

      await this.UserRepository.save(newUser);

      return {
        message: "User created",
      };
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        "An error occurred",
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.UserRepository.findOne({
        where: { id: id },
      });

      if (!user)
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);

      Object.assign(user, updateUserDto);

      await this.UserRepository.save(user);

      return {
        message: "User updated successfully",
      };
    } catch (error) {
      this.logger.log("error : " + error);

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
