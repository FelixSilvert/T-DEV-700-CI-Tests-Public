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
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { SignInDto } from "./dto/sign-in.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Auth")
@UseInterceptors(ClassSerializerInterceptor)
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description:
      "Public route: Authenticates a user using email and password and returns a JWT token.",
  })
  @ApiResponse({ status: 200, description: "Successfully authenticated, JWT returned" })
  @ApiResponse({ status: 400, description: "Invalid credentials" })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @ApiBearerAuth("JWT")
  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiOperation({
    summary: "Get current user",
    description: "Protected route: returns the currently authenticated user.",
  })
  @ApiResponse({ status: 200, description: "Current user retrieved", type: User })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
