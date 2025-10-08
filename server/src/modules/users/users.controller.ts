import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { AdminGuard } from "src/guards/admin.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AdminGuard)
  @Post()
  @ApiOperation({
    summary: "Route protected by admin guards",
    description: "Allows you to create a user.",
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to get all users.",
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to get a user by is id.",
  })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to update a user by is id.",
  })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to delete a user by is id.",
  })
  delete(@Param("id") id: string) {
    return this.usersService.delete(id);
  }
}
