import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiExtraModels,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UserRole, User } from "./entities/user.entity";
import { Clock } from "../clocks/entities/clock.entity";
import { CreateUserResult, UpdateUserResult, MessageResult } from "./types/user.types";
import { GetUser } from "./decorators/get-user.decorator";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiExtraModels(User, Clock)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new user",
    description:
      "Create a new user with working hours configuration. " +
      "Requires MANAGER or ADMIN role. " +
      "Only ADMIN can create users with ADMIN role.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User successfully created",
    schema: {
      example: {
        message: "User created successfully",
        user: {
          id: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          phoneNumber: "+33600000000",
          role: "user",
          IDTeam: null,
          expectedArrivalTime: "09:00",
          expectedDepartureTime: "17:00",
          lunchBreakDuration: 60,
          createdAt: "2025-10-14T13:48:39.000Z",
          updatedAt: "2025-10-14T13:48:39.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Validation failed" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: "Email or phone already in use" })
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() currentUser: User,
  ): Promise<CreateUserResult> {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all users",
    description: "Retrieve a list of all users. Passwords are automatically excluded.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of users",
    type: [User],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "No users found" })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a user by ID",
    description: "Retrieve detailed information about a specific user.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User found",
    type: User,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  async findOne(@Param("id") id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Get("team/:teamId/members")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all members of a team",
    description: "Retrieve all users belonging to a specific team.",
  })
  @ApiParam({
    name: "teamId",
    description: "Team UUID",
    type: String,
    example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of team members",
    type: [User],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "No users found" })
  async findAllByTeamId(@Param("teamId") teamId: string): Promise<User[]> {
    return this.usersService.findAllByTeamId(teamId);
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update a user",
    description:
      "Update user information including working hours. " +
      "Users can only update their own profile unless they are MANAGER or ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User updated successfully",
    schema: {
      example: {
        message: "User updated successfully",
        user: {
          id: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
          firstName: "John",
          lastName: "Doe Updated",
          email: "john.doe@email.com",
          phoneNumber: "+33600000000",
          role: "user",
          IDTeam: null,
          expectedArrivalTime: "09:00",
          expectedDepartureTime: "18:00",
          lunchBreakDuration: 60,
          createdAt: "2025-10-14T13:48:39.000Z",
          updatedAt: "2025-10-14T14:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Validation failed" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: "Email or phone already in use" })
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ): Promise<UpdateUserResult> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Patch(":id/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update user password",
    description:
      "Change user password with current password verification. " +
      "Users can only change their own password unless they are ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password updated successfully",
    schema: {
      example: {
        message: "Password updated successfully",
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Current password incorrect" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  async updatePassword(
    @Param("id") id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetUser() currentUser: User,
  ): Promise<MessageResult> {
    return this.usersService.updatePassword(id, updatePasswordDto, currentUser);
  }

  @Delete(":id")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a user",
    description:
      "Permanently delete a user. Requires MANAGER or ADMIN role. " +
      "MANAGER cannot delete ADMIN users.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User deleted successfully",
    schema: {
      example: {
        message: "User deleted successfully",
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  async delete(
    @Param("id") id: string,
    @GetUser() currentUser: User,
  ): Promise<MessageResult> {
    return this.usersService.delete(id, currentUser);
  }

  @Patch(":id/role")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update user role",
    description: "Change a user's role. Only ADMIN can perform this action.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Role updated successfully",
    schema: {
      example: {
        message: "User role updated successfully",
        user: {
          id: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          phoneNumber: "+33600000000",
          role: "manager",
          IDTeam: null,
          expectedArrivalTime: "09:00",
          expectedDepartureTime: "17:00",
          lunchBreakDuration: 60,
          createdAt: "2025-10-14T13:48:39.000Z",
          updatedAt: "2025-10-14T14:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  async updateRole(
    @Param("id") id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<UpdateUserResult> {
    return this.usersService.updateRole(id, updateRoleDto);
  }

  @Get(":id/clocks")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all clocks of a user",
    description: "Retrieve all clock entries for a specific user, ordered by timestamp.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    type: String,
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of user's clocks",
    type: [Clock],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "No clocks found" })
  async findUserClocks(@Param("id") id: string): Promise<Clock[]> {
    return this.usersService.findUserClocks(id);
  }
}