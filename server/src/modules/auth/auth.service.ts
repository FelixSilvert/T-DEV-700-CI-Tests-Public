import { Injectable, UnauthorizedException, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("Identifiants invalides");
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      this.logger.error("Error during signIn:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateUser(id: string) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      this.logger.error("Error validating user:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
