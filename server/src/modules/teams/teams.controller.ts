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
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { TeamsService } from "./teams.service";
import { RolesGuard } from "src/guards/roles.guard";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({
    summary: "Route protected by manager guards",
    description: "Allows you to create a team.",
  })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to get all teams.",
  })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to get a team by is id.",
  })
  findOne(@Param("id") id: string) {
    return this.teamsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to update a team by is id.",
  })
  update(@Param("id") id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Allows you to delete a team by is id.",
  })
  delete(@Param("id") id: string) {
    return this.teamsService.delete(id);
  }
}
