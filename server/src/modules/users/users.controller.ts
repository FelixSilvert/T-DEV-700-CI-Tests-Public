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
} from "@nestjs/common";
import {
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole, User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Create a new user",
    description: "Protected route: requires MANAGER or ADMIN role.",
  })
  @ApiResponse({ status: 201, description: "User successfully created", type: User })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all users",
    description: "Protected route: requires authentication.",
  })
  @ApiResponse({ status: 200, description: "List of users", type: [User] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a user by ID",
    description: "Protected route: requires authentication.",
  })
  @ApiResponse({ status: 200, description: "User found", type: User })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Get(":id/members")
  @ApiOperation({
    summary: "Get all members of a team",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "List of team members" })
  findAllByIDTeam(@Param("id") id: string) {
    return this.usersService.findAllByIDTeam(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update a user by ID",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "User updated", type: User })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "User not found" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a user by ID",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "User deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  delete(@Param("id") id: string) {
    return this.usersService.delete(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update a user's role",
    description: "Protected route: requires ADMIN role.",
  })
  @ApiResponse({ status: 200, description: "Role updated", type: User })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  updateRole(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto);
  }

  @Get(":id/clocks")
  @ApiOperation({
    summary: "Get all clocks of a user",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "List of clocks" })
  findAllByIDUser(@Param("id") id: string) {
    return this.usersService.findAllByIDUser(id);
  }
}
