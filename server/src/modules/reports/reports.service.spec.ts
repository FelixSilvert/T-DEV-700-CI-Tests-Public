import { Test, TestingModule } from "@nestjs/testing";
import { ReportsService } from "./reports.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Team } from "../teams/entities/team.entity";
import { KpiCalculatorService } from "./services/kpi-calculator.service";
import {
  BadRequestException,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { ReportScope, AvailableKpi } from "./dto/generate-report.dto";
import { UserRole } from "../users/entities/user.entity";

describe("ReportsService", () => {
  let service: ReportsService;
  let userRepository: any;
  let teamRepository: any;
  let kpiCalculator: any;

  const mockUser: Partial<User> = {
    id: "user-1",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.USER,
    clocks: [],
  };

  const mockTeam: Partial<Team> = {
    id: "team-1",
    name: "Engineering",
    members: [mockUser as User],
  };

  const mockKpiResult = {
    value: 40,
    unit: "hours",
    details: {},
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    teamRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    kpiCalculator = {
      calculateHoursWorked: jest.fn().mockReturnValue(mockKpiResult),
      calculateLateHours: jest.fn().mockReturnValue(mockKpiResult),
      calculateAverageHoursPerDay: jest.fn().mockReturnValue(mockKpiResult),
      calculateWorkedDays: jest.fn().mockReturnValue(mockKpiResult),
      calculateAbsences: jest.fn().mockReturnValue(mockKpiResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Team),
          useValue: teamRepository,
        },
        {
          provide: KpiCalculatorService,
          useValue: kpiCalculator,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateReport", () => {
    const validDto = {
      from: "2025-01-01",
      to: "2025-01-31",
      scope: ReportScope.GLOBAL,
      kpis: [AvailableKpi.HOURS_WORKED],
    };

    it("should generate a global report successfully", async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await service.generateReport(validDto);

      expect(result).toHaveProperty("scope", ReportScope.GLOBAL);
      expect(result).toHaveProperty("from", validDto.from);
      expect(result).toHaveProperty("to", validDto.to);
      expect(result).toHaveProperty("targetName", "All Users");
      expect(result).toHaveProperty("kpis");
      expect(result).toHaveProperty("generatedAt");
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ["clocks"],
      });
    });

    it("should generate a user-scoped report", async () => {
      const userDto = {
        ...validDto,
        scope: ReportScope.USER,
        userId: "user-1",
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.generateReport(userDto);

      expect(result.scope).toBe(ReportScope.USER);
      expect(result.targetId).toBe("user-1");
      expect(result.targetName).toBe("John Doe");
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: "user-1" },
        relations: ["clocks"],
      });
    });

    it("should generate a team-scoped report", async () => {
      const teamDto = {
        ...validDto,
        scope: ReportScope.TEAM,
        teamId: "team-1",
      };
      teamRepository.findOne.mockResolvedValue(mockTeam);

      const result = await service.generateReport(teamDto);

      expect(result.scope).toBe(ReportScope.TEAM);
      expect(result.targetId).toBe("team-1");
      expect(result.targetName).toBe("Engineering");
      expect(teamRepository.findOne).toHaveBeenCalledWith({
        where: { id: "team-1" },
        relations: ["members", "members.clocks"],
      });
    });

    it("should compute multiple KPIs", async () => {
      const multiKpiDto = {
        ...validDto,
        kpis: [
          AvailableKpi.HOURS_WORKED,
          AvailableKpi.LATE_HOURS,
          AvailableKpi.AVERAGE_HOURS_PER_DAY,
        ],
      };
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await service.generateReport(multiKpiDto);

      expect(result.kpis).toHaveProperty(AvailableKpi.HOURS_WORKED);
      expect(result.kpis).toHaveProperty(AvailableKpi.LATE_HOURS);
      expect(result.kpis).toHaveProperty(AvailableKpi.AVERAGE_HOURS_PER_DAY);
      expect(kpiCalculator.calculateHoursWorked).toHaveBeenCalled();
      expect(kpiCalculator.calculateLateHours).toHaveBeenCalled();
      expect(kpiCalculator.calculateAverageHoursPerDay).toHaveBeenCalled();
    });

    it("should throw BadRequestException if from > to", async () => {
      const invalidDto = {
        ...validDto,
        from: "2025-02-01",
        to: "2025-01-01",
      };

      await expect(service.generateReport(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for future dates", async () => {
      const futureDto = {
        ...validDto,
        from: "2026-01-01",
        to: "2026-12-31",
      };

      await expect(service.generateReport(futureDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when userId missing for USER scope", async () => {
      const invalidDto = {
        ...validDto,
        scope: ReportScope.USER,
      };

      await expect(service.generateReport(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when teamId missing for TEAM scope", async () => {
      const invalidDto = {
        ...validDto,
        scope: ReportScope.TEAM,
      };

      await expect(service.generateReport(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException when user not found", async () => {
      const userDto = {
        ...validDto,
        scope: ReportScope.USER,
        userId: "invalid-id",
      };
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.generateReport(userDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when team not found", async () => {
      const teamDto = {
        ...validDto,
        scope: ReportScope.TEAM,
        teamId: "invalid-id",
      };
      teamRepository.findOne.mockResolvedValue(null);

      await expect(service.generateReport(teamDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when no users found", async () => {
      userRepository.find.mockResolvedValue([]);

      await expect(service.generateReport(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should handle database errors gracefully", async () => {
      userRepository.find.mockRejectedValue(new Error("Database error"));

      await expect(service.generateReport(validDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe("getAvailableKpis", () => {
    it("should return all available KPIs", () => {
      const kpis = service.getAvailableKpis();

      expect(kpis).toBeInstanceOf(Array);
      expect(kpis.length).toBeGreaterThan(0);
      expect(kpis[0]).toHaveProperty("kpi");
      expect(kpis[0]).toHaveProperty("description");
      expect(kpis[0]).toHaveProperty("unit");
    });

    it("should include HOURS_WORKED KPI", () => {
      const kpis = service.getAvailableKpis();

      const hoursWorkedKpi = kpis.find(
        (k) => k.kpi === AvailableKpi.HOURS_WORKED,
      );
      expect(hoursWorkedKpi).toBeDefined();
      expect(hoursWorkedKpi?.description).toBe("Total hours worked");
      expect(hoursWorkedKpi?.unit).toBe("hours");
    });

    it("should include all standard KPIs", () => {
      const kpis = service.getAvailableKpis();
      const kpiNames = kpis.map((k) => k.kpi);

      expect(kpiNames).toContain(AvailableKpi.HOURS_WORKED);
      expect(kpiNames).toContain(AvailableKpi.LATE_HOURS);
      expect(kpiNames).toContain(AvailableKpi.AVERAGE_HOURS_PER_DAY);
      expect(kpiNames).toContain(AvailableKpi.WORKED_DAYS);
      expect(kpiNames).toContain(AvailableKpi.ABSENCES);
    });
  });
});
