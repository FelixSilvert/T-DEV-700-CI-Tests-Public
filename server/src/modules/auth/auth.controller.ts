import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { SignInDto } from "./dto/sign-in.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Connexion utilisateur",
    description:
      "Authentifie un utilisateur avec son email et mot de passe et retourne un token JWT",
  })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Get("me")
  @ApiOperation({
    summary: "Route protected by auth guard",
    description: "Allows you to get the current user.",
  })
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
