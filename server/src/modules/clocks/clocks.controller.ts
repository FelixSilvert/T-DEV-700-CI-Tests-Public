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
import { CursorPaginatedResponse } from "../../common/pagination/pagination.types";

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
    description: "Load-more pagination for clocks",
    schema: {
      example: {
        data: [
          {
            id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            type: "arrival",
            timestamp: "2025-10-14T08:30:00.000Z",
            IDUser: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
            createdAt: "2025-10-14T08:30:01.000Z",
            updatedAt: "2025-10-14T08:30:01.000Z",
            user: {
              id: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@email.com",
            },
          },
        ],
        meta: {
          totalItems: 120,
          perPage: 20,
          hasMore: true,
          nextCursor: "MjAyNS0xMC0xNFQwODozMDowMC4wMDBaOjphMWIyYzNkNC1lNWY2LTc4OTAtMTIzNC01Njc4OTBhYmNkZWY=",
        },
      },
    },
  })
  findAll(@Query() queryDto: QueryClocksDto): Promise<CursorPaginatedResponse<Clock>> {
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