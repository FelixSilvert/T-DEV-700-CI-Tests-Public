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
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
} from "@nestjs/swagger";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { TeamsService } from "./teams.service";
import { RolesGuard } from "../../guards/roles.guard";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Teams")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new team",
    description: "Protected route: requires authentication and proper role (Manager).",
  })
  @ApiResponse({ status: 201, description: "Team successfully created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all teams",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "List of teams" })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a team by ID",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "Team found" })
  @ApiResponse({ status: 404, description: "Team not found" })
  findOne(@Param("id") id: string) {
    return this.teamsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update a team by ID",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "Team updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Team not found" })
  update(@Param("id") id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a team by ID",
    description: "Public route: no authentication required.",
  })
  @ApiResponse({ status: 200, description: "Team deleted" })
  @ApiResponse({ status: 404, description: "Team not found" })
  delete(@Param("id") id: string) {
    return this.teamsService.delete(id);
  }
}
