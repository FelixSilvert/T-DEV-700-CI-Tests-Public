import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
} from "@nestjs/swagger";
import { ClocksService } from "./clocks.service";
import { CreateClockDto } from "./dto/create-clock.dto";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";

@ApiTags("Clocks")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("clocks")
export class ClocksController {
  constructor(private readonly clocksService: ClocksService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new clock",
    description: "Protected route: requires authentication and proper roles.",
  })
  @ApiResponse({ status: 201, description: "Clock successfully created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() createClockDto: CreateClockDto) {
    return this.clocksService.create(createClockDto);
  }
}
