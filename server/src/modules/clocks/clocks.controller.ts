import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { ClocksService } from "./clocks.service";
import { CreateClockDto } from "./dto/create-clock.dto";
import { UpdateClockDto } from "./dto/update-clock.dto";
import { QueryClocksDto } from "./dto/query-clocks.dto";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { Clock } from "./entities/clock.entity";

@ApiTags("Clocks")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("clocks")
export class ClocksController {
  constructor(private readonly clocksService: ClocksService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new clock entry",
    description:
      "Records a clock entry (arrival, lunchStart, lunchEnd, departure). " +
      "Validates business rules (e.g., arrival must be first, departure must be last). " +
      "If timestamp is not provided, current time is used.",
  })
  @ApiResponse({
    status: 201,
    description: "Clock successfully created",
    schema: {
      example: {
        message: "Clock created successfully",
        clock: {
          id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          type: "arrival",
          timestamp: "2025-10-14T08:30:00.000Z",
          IDUser: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
          createdAt: "2025-10-14T08:30:01.000Z",
          updatedAt: "2025-10-14T08:30:01.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Validation failed or business rule violated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Conflict - clock already exists for this type today" })
  create(@Body() createClockDto: CreateClockDto) {
    return this.clocksService.create(createClockDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get clocks with optional filters",
    description:
      "Retrieve clocks filtered by userId, teamId, type, or date range. " +
      "All filters are optional and can be combined.",
  })
  @ApiResponse({
    status: 200,
    description: "List of clocks",
    type: [Clock],
  })
  @ApiResponse({ status: 404, description: "No clocks found" })
  findAll(@Query() queryDto: QueryClocksDto) {
    return this.clocksService.findAll(queryDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a clock by ID",
    description: "Retrieve a specific clock entry by its unique identifier.",
  })
  @ApiParam({
    name: "id",
    description: "Clock UUID",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @ApiResponse({
    status: 200,
    description: "Clock found",
    type: Clock,
  })
  @ApiResponse({ status: 404, description: "Clock not found" })
  findOne(@Param("id") id: string) {
    return this.clocksService.findOne(id);
  }

  @Get("user/:userId")
  @ApiOperation({
    summary: "Get all clocks for a specific user",
    description: "Retrieve all clock entries for a given user, ordered by timestamp (descending).",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: 200,
    description: "List of user's clocks",
    type: [Clock],
  })
  @ApiResponse({ status: 404, description: "User not found or no clocks found" })
  findByUser(@Param("userId") userId: string) {
    return this.clocksService.findByUser(userId);
  }

  @Get("user/:userId/today")
  @ApiOperation({
    summary: "Get today's clocks for a user",
    description: "Retrieve all clock entries for today for a specific user.",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: 200,
    description: "Today's clocks",
    type: [Clock],
  })
  findTodayClocks(@Param("userId") userId: string) {
    return this.clocksService.findTodayClocks(userId);
  }

  @Get("user/:userId/worked-hours")
  @ApiOperation({
    summary: "Calculate worked hours for a user",
    description:
      "Calculate total worked hours for a user within a date range. " +
      "Automatically excludes lunch breaks from the calculation.",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiResponse({
    status: 200,
    description: "Worked hours calculated",
    schema: {
      example: {
        userId: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
        from: "2025-10-01T00:00:00.000Z",
        to: "2025-10-14T23:59:59.999Z",
        workedHours: 112.5,
        unit: "hours",
      },
    },
  })
  async calculateWorkedHours(
    @Param("userId") userId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1)); // Début du mois si non fourni
    const toDate = to ? new Date(to) : new Date();

    const workedHours = await this.clocksService.calculateWorkedHours(userId, fromDate, toDate);

    return {
      userId,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      workedHours,
      unit: "hours",
    };
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update a clock entry",
    description: "Update the type or timestamp of an existing clock entry.",
  })
  @ApiParam({
    name: "id",
    description: "Clock UUID",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @ApiResponse({
    status: 200,
    description: "Clock updated successfully",
  })
  @ApiResponse({ status: 404, description: "Clock not found" })
  update(@Param("id") id: string, @Body() updateClockDto: UpdateClockDto) {
    return this.clocksService.update(id, updateClockDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a clock entry",
    description: "Permanently delete a clock entry by its ID.",
  })
  @ApiParam({
    name: "id",
    description: "Clock UUID",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @ApiResponse({
    status: 200,
    description: "Clock deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Clock not found" })
  delete(@Param("id") id: string) {
    return this.clocksService.delete(id);
  }
}