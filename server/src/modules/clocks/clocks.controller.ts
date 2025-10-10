import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ClocksService } from "./clocks.service";
import { CreateClockDto } from "./dto/create-clock.dto";
import { ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { RolesGuard } from "src/guards/roles.guard";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("clocks")
export class ClocksController {
  constructor(private readonly clocksService: ClocksService) {}

  @Post()
  @ApiOperation({
    summary: "Route protected by roles guards",
    description: "Allows you to create a user.",
  })
  create(@Body() createClockDto: CreateClockDto) {
    return this.clocksService.create(createClockDto);
  }
}
