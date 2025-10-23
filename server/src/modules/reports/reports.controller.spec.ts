import { Test, TestingModule } from "@nestjs/testing";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { BadRequestException } from "@nestjs/common";
import { ReportScope, AvailableKpi } from "./dto/generate-report.dto";

describe("ReportsController", () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportResponse = {
    scope: ReportScope.GLOBAL,
    from: "2025-01-01",
    to: "2025-01-31",
    targetId: null,
    targetName: "All Users",
    kpis: {
      hoursWorked: { value: 160, unit: "hours", details: {} },
    },
    generatedAt: new Date().toISOString(),
  };

  const mockAvailableKpis = [
    {
      kpi: AvailableKpi.HOURS_WORKED,
      description: "Total hours worked",
      unit: "hours",
    },
  ];

  beforeEach(async () => {
    const mockService = {
      generateReport: jest.fn().mockResolvedValue(mockReportResponse),
      getAvailableKpis: jest.fn().mockReturnValue(mockAvailableKpis),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("generateReport", () => {
    it("should generate a report with valid parameters", async () => {
      const result = await controller.generateReport(
        "2025-01-01",
        "2025-01-31",
        "hoursWorked,lateHours",
      );

      expect(result).toEqual(mockReportResponse);
      expect(service.generateReport).toHaveBeenCalledWith({
        from: "2025-01-01",
        to: "2025-01-31",
        kpis: [AvailableKpi.HOURS_WORKED, AvailableKpi.LATE_HOURS],
        scope: ReportScope.GLOBAL,
        userId: undefined,
        teamId: undefined,
      });
    });

    it("should handle user scope", async () => {
      await controller.generateReport(
        "2025-01-01",
        "2025-01-31",
        "hoursWorked",
        ReportScope.USER,
        "user-1",
      );

      expect(service.generateReport).toHaveBeenCalledWith({
        from: "2025-01-01",
        to: "2025-01-31",
        kpis: [AvailableKpi.HOURS_WORKED],
        scope: ReportScope.USER,
        userId: "user-1",
        teamId: undefined,
      });
    });

    it("should handle team scope", async () => {
      await controller.generateReport(
        "2025-01-01",
        "2025-01-31",
        "hoursWorked",
        ReportScope.TEAM,
        undefined,
        "team-1",
      );

      expect(service.generateReport).toHaveBeenCalledWith({
        from: "2025-01-01",
        to: "2025-01-31",
        kpis: [AvailableKpi.HOURS_WORKED],
        scope: ReportScope.TEAM,
        userId: undefined,
        teamId: "team-1",
      });
    });

    it("should parse multiple KPIs correctly", async () => {
      await controller.generateReport(
        "2025-01-01",
        "2025-01-31",
        "hoursWorked,lateHours,averageHoursPerDay,workedDays,absences",
      );

      expect(service.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          kpis: [
            AvailableKpi.HOURS_WORKED,
            AvailableKpi.LATE_HOURS,
            AvailableKpi.AVERAGE_HOURS_PER_DAY,
            AvailableKpi.WORKED_DAYS,
            AvailableKpi.ABSENCES,
          ],
        }),
      );
    });

    it("should throw BadRequestException for invalid KPI", async () => {
      await expect(
        controller.generateReport("2025-01-01", "2025-01-31", "invalidKpi"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for missing required parameters", async () => {
      await expect(
        controller.generateReport("", "2025-01-31", "hoursWorked"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getAvailableKpis", () => {
    it("should return available KPIs", () => {
      const result = controller.getAvailableKpis();

      expect(result).toEqual(mockAvailableKpis);
      expect(service.getAvailableKpis).toHaveBeenCalled();
    });
  });
});
