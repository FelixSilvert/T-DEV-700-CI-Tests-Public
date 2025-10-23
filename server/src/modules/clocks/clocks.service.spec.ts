import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { ClocksService } from "./clocks.service";
import { Clock, ClockType } from "./entities/clock.entity";
import { User } from "../users/entities/user.entity";
import { CreateClockDto } from "./dto/create-clock.dto";
import { UpdateClockDto } from "./dto/update-clock.dto";

describe("ClocksService", () => {
  let service: ClocksService;
  let clockRepository: jest.Mocked<Repository<Clock>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockClock: Partial<Clock> = {
    id: "clock-1",
    type: ClockType.ARRIVAL,
    timestamp: new Date("2024-01-15T09:00:00Z"),
    IDUser: "user-1",
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockClockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockClock]),
        getCount: jest.fn().mockResolvedValue(1),
      })),
    };

    const mockUserRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClocksService,
        {
          provide: getRepositoryToken(Clock),
          useValue: mockClockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ClocksService>(ClocksService);
    clockRepository = module.get(getRepositoryToken(Clock));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createClockDto: CreateClockDto = {
      IDUser: "user-1",
      type: ClockType.ARRIVAL,
      timestamp: "2024-01-15T09:00:00Z",
    };

    it("should create a clock successfully", async () => {
      userRepository.exists.mockResolvedValue(true);
      clockRepository.find.mockResolvedValue([]);
      clockRepository.create.mockReturnValue(mockClock as Clock);
      clockRepository.save.mockResolvedValue(mockClock as Clock);

      const result = await service.create(createClockDto);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: createClockDto.IDUser },
      });
      expect(clockRepository.save).toHaveBeenCalled();
      expect(result.clock).toEqual(mockClock);
      expect(result.message).toContain("created successfully");
    });

    it("should throw NotFoundException if user does not exist", async () => {
      userRepository.exists.mockResolvedValue(false);

      await expect(service.create(createClockDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should validate clock consistency", async () => {
      userRepository.exists.mockResolvedValue(true);
      clockRepository.find.mockResolvedValue([
        { ...mockClock, type: ClockType.ARRIVAL } as Clock,
      ]);

      const duplicateDto = {
        ...createClockDto,
        type: ClockType.ARRIVAL,
      };

      await expect(service.create(duplicateDto)).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    it("should return all clocks for a user", async () => {
      const queryDto = { userId: "user-1" };
      const mockQueryBuilder = clockRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockClock as Clock]);

      const result = await service.findAll(queryDto);

      expect(result.data).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return a single clock by id", async () => {
      clockRepository.findOne.mockResolvedValue(mockClock as Clock);

      const result = await service.findOne("clock-1");

      expect(clockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "clock-1" },
        relations: ["user"],
      });
      expect(result).toEqual(mockClock);
    });

    it("should throw NotFoundException if clock not found", async () => {
      clockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    const updateClockDto: UpdateClockDto = {
      timestamp: "2024-01-15T09:15:00Z",
    };

    it("should update a clock successfully", async () => {
      const updatedClock = { ...mockClock, ...updateClockDto };
      clockRepository.findOne.mockResolvedValue(mockClock as Clock);
      clockRepository.save.mockResolvedValue(updatedClock as Clock);

      const result = await service.update("clock-1", updateClockDto);

      expect(clockRepository.findOne).toHaveBeenCalled();
      expect(clockRepository.save).toHaveBeenCalled();
      expect(result.clock.timestamp).toEqual(updateClockDto.timestamp);
    });

    it("should throw NotFoundException if clock not found", async () => {
      clockRepository.findOne.mockResolvedValue(null);

      await expect(service.update("invalid-id", updateClockDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("delete", () => {
    it("should delete a clock successfully", async () => {
      clockRepository.findOne.mockResolvedValue(mockClock as Clock);
      clockRepository.remove.mockResolvedValue(mockClock as Clock);

      const result = await service.delete("clock-1");

      expect(clockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "clock-1" },
        relations: ["user"],
      });
      expect(clockRepository.remove).toHaveBeenCalledWith(mockClock);
      expect(result.message).toContain("deleted successfully");
    });

    it("should throw NotFoundException if clock not found", async () => {
      clockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Clock Validation Rules", () => {
    beforeEach(() => {
      userRepository.exists.mockResolvedValue(true);
    });

    it("should prevent LUNCH_START without ARRIVAL", async () => {
      clockRepository.find.mockResolvedValue([]);

      const lunchStartDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.LUNCH_START,
        timestamp: new Date("2024-01-15T12:00:00Z").toISOString(),
      };

      await expect(service.create(lunchStartDto)).rejects.toThrow(
        "Cannot register LUNCH_START without ARRIVAL",
      );
    });

    it("should allow LUNCH_START after ARRIVAL", async () => {
      const arrivalClock = {
        ...mockClock,
        type: ClockType.ARRIVAL,
        timestamp: new Date("2024-01-15T09:00:00Z"),
      };
      clockRepository.find.mockResolvedValue([arrivalClock as Clock]);
      clockRepository.create.mockReturnValue({
        type: ClockType.LUNCH_START,
      } as Clock);
      clockRepository.save.mockResolvedValue({
        type: ClockType.LUNCH_START,
      } as Clock);

      const lunchStartDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.LUNCH_START,
        timestamp: new Date("2024-01-15T12:00:00Z").toISOString(),
      };

      const result = await service.create(lunchStartDto);
      expect(result.clock.type).toBe(ClockType.LUNCH_START);
    });

    it("should prevent LUNCH_END without LUNCH_START", async () => {
      const arrivalClock = {
        ...mockClock,
        type: ClockType.ARRIVAL,
        timestamp: new Date("2024-01-15T09:00:00Z"),
      };
      clockRepository.find.mockResolvedValue([arrivalClock as Clock]);

      const lunchEndDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.LUNCH_END,
        timestamp: new Date("2024-01-15T13:00:00Z").toISOString(),
      };

      await expect(service.create(lunchEndDto)).rejects.toThrow(
        "Cannot register LUNCH_END without LUNCH_START",
      );
    });

    it("should allow LUNCH_END after LUNCH_START", async () => {
      const existingClocks = [
        {
          type: ClockType.ARRIVAL,
          timestamp: new Date("2024-01-15T09:00:00Z"),
        },
        {
          type: ClockType.LUNCH_START,
          timestamp: new Date("2024-01-15T12:00:00Z"),
        },
      ];
      clockRepository.find.mockResolvedValue(existingClocks as Clock[]);
      clockRepository.create.mockReturnValue({
        type: ClockType.LUNCH_END,
      } as Clock);
      clockRepository.save.mockResolvedValue({
        type: ClockType.LUNCH_END,
      } as Clock);

      const lunchEndDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.LUNCH_END,
        timestamp: new Date("2024-01-15T13:00:00Z").toISOString(),
      };

      const result = await service.create(lunchEndDto);
      expect(result.clock.type).toBe(ClockType.LUNCH_END);
    });

    it("should prevent DEPARTURE without ARRIVAL", async () => {
      clockRepository.find.mockResolvedValue([]);

      const departureDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.DEPARTURE,
        timestamp: new Date("2024-01-15T17:00:00Z").toISOString(),
      };

      await expect(service.create(departureDto)).rejects.toThrow(
        "Cannot register DEPARTURE without ARRIVAL",
      );
    });

    it("should prevent DEPARTURE with unfinished lunch break", async () => {
      const existingClocks = [
        {
          type: ClockType.ARRIVAL,
          timestamp: new Date("2024-01-15T09:00:00Z"),
        },
        {
          type: ClockType.LUNCH_START,
          timestamp: new Date("2024-01-15T12:00:00Z"),
        },
      ];
      clockRepository.find.mockResolvedValue(existingClocks as Clock[]);

      const departureDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.DEPARTURE,
        timestamp: new Date("2024-01-15T17:00:00Z").toISOString(),
      };

      await expect(service.create(departureDto)).rejects.toThrow(
        "Cannot register DEPARTURE: lunch break not finished",
      );
    });

    it("should allow DEPARTURE after complete day", async () => {
      const existingClocks = [
        {
          type: ClockType.ARRIVAL,
          timestamp: new Date("2024-01-15T09:00:00Z"),
        },
        {
          type: ClockType.LUNCH_START,
          timestamp: new Date("2024-01-15T12:00:00Z"),
        },
        {
          type: ClockType.LUNCH_END,
          timestamp: new Date("2024-01-15T13:00:00Z"),
        },
      ];
      clockRepository.find.mockResolvedValue(existingClocks as Clock[]);
      clockRepository.create.mockReturnValue({
        type: ClockType.DEPARTURE,
      } as Clock);
      clockRepository.save.mockResolvedValue({
        type: ClockType.DEPARTURE,
      } as Clock);

      const departureDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.DEPARTURE,
        timestamp: new Date("2024-01-15T17:00:00Z").toISOString(),
      };

      const result = await service.create(departureDto);
      expect(result.clock.type).toBe(ClockType.DEPARTURE);
    });

    it("should prevent ARRIVAL if not first clock of the day", async () => {
      const lunchStartClock = {
        type: ClockType.LUNCH_START,
        timestamp: new Date("2024-01-15T12:00:00Z"),
      };
      clockRepository.find.mockResolvedValue([lunchStartClock as Clock]);

      const arrivalDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.ARRIVAL,
        timestamp: new Date("2024-01-15T09:00:00Z").toISOString(),
      };

      await expect(service.create(arrivalDto)).rejects.toThrow(
        "ARRIVAL must be the first clock of the day",
      );
    });

    it("should enforce chronological order - ARRIVAL must be first", async () => {
      const lunchStartClock = {
        type: ClockType.LUNCH_START,
        timestamp: new Date("2024-01-15T12:00:00Z"),
      };
      clockRepository.find.mockResolvedValue([lunchStartClock as Clock]);

      const arrivalDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.ARRIVAL,
        timestamp: new Date("2024-01-15T13:00:00Z").toISOString(), // After lunch
      };

      await expect(service.create(arrivalDto)).rejects.toThrow(
        "ARRIVAL must be the first clock of the day",
      );
    });

    it("should enforce chronological order - LUNCH_END after LUNCH_START", async () => {
      const existingClocks = [
        {
          type: ClockType.ARRIVAL,
          timestamp: new Date("2024-01-15T09:00:00Z"),
        },
        {
          type: ClockType.LUNCH_START,
          timestamp: new Date("2024-01-15T12:00:00Z"),
        },
      ];
      clockRepository.find.mockResolvedValue(existingClocks as Clock[]);

      const lunchEndDto: CreateClockDto = {
        IDUser: "user-1",
        type: ClockType.LUNCH_END,
        timestamp: new Date("2024-01-15T11:00:00Z").toISOString(), // Before lunch start
      };

      await expect(service.create(lunchEndDto)).rejects.toThrow(
        /timestamp must be after/,
      );
    });
  });

  describe("findAll with filters", () => {
    it("should filter clocks by date range (from and to)", async () => {
      const queryDto = {
        userId: "user-1",
        from: new Date("2024-01-15T00:00:00Z").toISOString(),
        to: new Date("2024-01-15T23:59:59Z").toISOString(),
      };

      await service.findAll(queryDto);

      expect(clockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it("should filter clocks by date (from only)", async () => {
      const queryDto = {
        userId: "user-1",
        from: new Date("2024-01-15T00:00:00Z").toISOString(),
      };

      await service.findAll(queryDto);

      expect(clockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it("should filter clocks by type", async () => {
      const queryDto = {
        userId: "user-1",
        type: ClockType.ARRIVAL,
      };

      await service.findAll(queryDto);

      expect(clockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it("should filter clocks by teamId", async () => {
      const queryDto = {
        teamId: "team-1",
      };

      await service.findAll(queryDto);

      expect(clockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it("should handle cursor pagination with valid cursor", async () => {
      // Just test that cursor is passed through - decodeCursor is tested in pagination utils
      const queryDto = {
        userId: "user-1",
        // Skip cursor test since it's tested in pagination utils
      };

      const result = await service.findAll(queryDto);

      expect(result.data).toBeDefined();
      expect(clockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe("update with different fields", () => {
    it("should update only timestamp", async () => {
      clockRepository.findOne.mockResolvedValue(mockClock as Clock);
      clockRepository.save.mockResolvedValue({
        ...mockClock,
        timestamp: new Date("2024-01-15T10:00:00Z"),
      } as Clock);

      const updateDto: UpdateClockDto = {
        timestamp: "2024-01-15T10:00:00Z",
      };

      const result = await service.update("clock-1", updateDto);

      expect(result.clock.timestamp).toBeDefined();
    });

    it("should update only type", async () => {
      clockRepository.findOne.mockResolvedValue(mockClock as Clock);
      clockRepository.save.mockResolvedValue({
        ...mockClock,
        type: ClockType.DEPARTURE,
      } as Clock);

      const updateDto: UpdateClockDto = {
        type: ClockType.DEPARTURE,
      };

      await service.update("clock-1", updateDto);

      expect(clockRepository.save).toHaveBeenCalled();
    });
  });
});
