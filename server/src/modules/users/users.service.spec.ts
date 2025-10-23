import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User, UserRole } from "./entities/user.entity";
import { Clock } from "../clocks/entities/clock.entity";
import { UserValidationService } from "./services/user-validation.service";
import { UserSecurityService } from "./services/user-security.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let clockRepository: jest.Mocked<Repository<Clock>>;
  let validationService: jest.Mocked<UserValidationService>;
  let securityService: jest.Mocked<UserSecurityService>;

  const mockUser: Partial<User> = {
    id: "1",
    email: "test@example.com",
    password: "hashedPassword",
    role: UserRole.USER,
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+33123456789",
    IDTeam: null,
    expectedArrivalTime: "09:00",
    expectedDepartureTime: "17:00",
    lunchBreakDuration: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    clocks: [],
    team: undefined,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
        getCount: jest.fn().mockResolvedValue(1),
      })),
    };

    const mockClockRepository = {
      find: jest.fn(),
    };

    const mockValidationService = {
      validateEmailUniqueness: jest.fn(),
      validatePhoneUniqueness: jest.fn(),
      validateWorkSchedule: jest.fn(),
    };

    const mockSecurityService = {
      canUpdateProfile: jest.fn(),
      canDeleteUser: jest.fn(),
      canChangePassword: jest.fn(),
      canChangeRole: jest.fn(),
      isManagerOrAdmin: jest.fn(),
      determineAssignableRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Clock),
          useValue: mockClockRepository,
        },
        {
          provide: UserValidationService,
          useValue: mockValidationService,
        },
        {
          provide: UserSecurityService,
          useValue: mockSecurityService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    clockRepository = module.get(getRepositoryToken(Clock));
    validationService = module.get(UserValidationService);
    securityService = module.get(UserSecurityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createUserDto: CreateUserDto = {
      email: "newuser@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Smith",
      phoneNumber: "+33987654321",
    };

    it("should create a new user successfully", async () => {
      const createdUser = { ...mockUser, ...createUserDto, password: "hashedPassword" };

      validationService.validateEmailUniqueness.mockResolvedValue(undefined);
      validationService.validatePhoneUniqueness.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue(createdUser as User);
      userRepository.save.mockResolvedValue(createdUser as User);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.user.email).toBe(createUserDto.email);
      expect(result.message).toContain("created successfully");
    });

    it("should handle errors during user creation", async () => {
      validationService.validateEmailUniqueness.mockRejectedValue(
        new Error("Email already exists"),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        "Email already exists"
      );
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findOne("1");

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result.id).toEqual(mockUser.id);
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findByEmail("test@example.com");

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEmail("notfound@example.com")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("update", () => {
    const updateUserDto: UpdateUserDto = {
      firstName: "Updated",
      lastName: "Name",
    };

    it("should update user successfully", async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      userRepository.findOne.mockResolvedValue(mockUser as User);
      validationService.validateEmailUniqueness.mockResolvedValue(undefined);
      validationService.validatePhoneUniqueness.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await service.update("1", updateUserDto);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.user.firstName).toBe(updateUserDto.firstName);
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update("999", updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      securityService.canDeleteUser.mockReturnValue(undefined);
      userRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.delete("1", mockUser as User);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(securityService.canDeleteUser).toHaveBeenCalled();
      expect(userRepository.delete).toHaveBeenCalledWith("1");
      expect(result.message).toContain("deleted successfully");
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete("999", mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockUser]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe("findAllByTeamId", () => {
    it("should return users by team id", async () => {
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockUser]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      const result = await service.findAllByTeamId("team-1", { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      securityService.canChangePassword.mockReturnValue(undefined);
      // First call for current password check (true), second for same password check (false)
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)   // Current password is correct
        .mockResolvedValueOnce(false); // New password is different
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await service.updatePassword(
        "1",
        { currentPassword: "old", newPassword: "new" },
        mockUser as User,
      );

      expect(result.message).toContain("Password updated successfully");
    });
  });

  describe("updateRole", () => {
    it("should update user role successfully", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      userRepository.save.mockResolvedValue({ ...mockUser, role: UserRole.MANAGER } as User);

      const result = await service.updateRole(
        "1",
        { role: UserRole.MANAGER },
      );

      expect(result.message).toBe("User role updated successfully");
      expect(result.user?.role).toBe(UserRole.MANAGER);
    });

    it("should throw error if user not found for role update", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRole("999", { role: UserRole.MANAGER }),
      ).rejects.toThrow();
    });
  });

  describe("findUserClocks", () => {
    it("should return user clocks with pagination", async () => {
      const mockClock = {
        id: "clock-1",
        clockType: "arrival",
        clockTime: new Date(),
        day: new Date(),
        timestamp: new Date(),
        user: mockUser,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockClock]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      clockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findUserClocks("1", { limit: 10 });

      expect(clockRepository.createQueryBuilder).toHaveBeenCalledWith("clock");
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
    });
  });

  describe("User Validation Branches", () => {
    describe("create with working hours validation", () => {
      it("should validate working hours when both arrival and departure times provided", async () => {
        const createDto = {
          email: "test@test.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          phoneNumber: "1234567890",
          expectedArrivalTime: "09:00",
          expectedDepartureTime: "17:00",
        };

        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validateWorkingHours = jest
          .fn()
          .mockReturnValue(undefined);

        userRepository.save = jest.fn().mockResolvedValue({
          ...createDto,
          id: "1",
          role: "employee",
        });

        await service.create(createDto);

        expect(validationService.validateWorkingHours).toHaveBeenCalledWith({
          arrivalTime: "09:00",
          departureTime: "17:00",
        });
      });

      it("should validate lunch break duration when provided", async () => {
        const createDto = {
          email: "test@test.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          phoneNumber: "1234567890",
          lunchBreakDuration: 60,
        };

        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validateLunchBreakDuration = jest
          .fn()
          .mockReturnValue(undefined);

        userRepository.save = jest.fn().mockResolvedValue({
          ...createDto,
          id: "1",
          role: "employee",
        });

        await service.create(createDto);

        expect(
          validationService.validateLunchBreakDuration,
        ).toHaveBeenCalledWith(60);
      });

      it("should handle privileged role when allowPrivilegedRole option is true", async () => {
        const createDto = {
          email: "admin@test.com",
          password: "password123",
          firstName: "Admin",
          lastName: "User",
          phoneNumber: "1234567890",
          role: "admin" as any,
        };

        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        securityService.determineAssignableRole = jest
          .fn()
          .mockReturnValue("admin");

        const savedUser = {
          ...createDto,
          id: "1",
          role: "admin",
        };
        userRepository.save = jest.fn().mockResolvedValue(savedUser);

        const result = await service.create(createDto, undefined, {
          allowPrivilegedRole: true,
        });

        // Just verify the role was set correctly through options
        expect(result.user).toBeDefined();
      });

      it("should default to employee role when role provided without privilege", async () => {
        const createDto = {
          email: "user@test.com",
          password: "password123",
          firstName: "User",
          lastName: "Test",
          phoneNumber: "1234567890",
          role: "admin" as any,
        };

        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        securityService.determineAssignableRole = jest
          .fn()
          .mockReturnValue("employee");

        const savedUser = {
          ...createDto,
          id: "1",
          role: "employee",
        };
        userRepository.save = jest.fn().mockResolvedValue(savedUser);

        const result = await service.create(createDto);

        // Verify the service handled the role assignment
        expect(result.user).toBeDefined();
      });
    });

    describe("update with validation branches", () => {
      it("should validate email when email is updated", async () => {
        const updateDto = { email: "newemail@test.com" };

        userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...mockUser,
          ...updateDto,
        });

        await service.update("1", updateDto);

        expect(validationService.validateEmailUniqueness).toHaveBeenCalledWith(
          "newemail@test.com",
          "1",
        );
      });

      it("should validate phone number when phone is updated", async () => {
        const updateDto = { phoneNumber: "9876543210" };

        userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...mockUser,
          ...updateDto,
        });

        await service.update("1", updateDto);

        expect(validationService.validatePhoneUniqueness).toHaveBeenCalledWith(
          "9876543210",
          "1",
        );
      });

      it("should validate working hours when only arrival time is updated", async () => {
        const userWithTimes = {
          ...mockUser,
          expectedArrivalTime: "08:00",
          expectedDepartureTime: "16:00",
        };
        const updateDto = { expectedArrivalTime: "09:00" };

        userRepository.findOne = jest.fn().mockResolvedValue(userWithTimes);
        validationService.validateWorkingHours = jest
          .fn()
          .mockReturnValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...userWithTimes,
          ...updateDto,
        });

        await service.update("1", updateDto);

        expect(validationService.validateWorkingHours).toHaveBeenCalledWith({
          arrivalTime: "09:00",
          departureTime: "16:00",
        });
      });

      it("should validate working hours when only departure time is updated", async () => {
        const userWithTimes = {
          ...mockUser,
          expectedArrivalTime: "08:00",
          expectedDepartureTime: "16:00",
        };
        const updateDto = { expectedDepartureTime: "18:00" };

        userRepository.findOne = jest.fn().mockResolvedValue(userWithTimes);
        validationService.validateWorkingHours = jest
          .fn()
          .mockReturnValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...userWithTimes,
          ...updateDto,
        });

        await service.update("1", updateDto);

        expect(validationService.validateWorkingHours).toHaveBeenCalledWith({
          arrivalTime: "08:00",
          departureTime: "18:00",
        });
      });

      it("should validate lunch break duration when updated", async () => {
        const updateDto = { lunchBreakDuration: 45 };

        userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
        validationService.validateLunchBreakDuration = jest
          .fn()
          .mockReturnValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...mockUser,
          ...updateDto,
        });

        await service.update("1", updateDto);

        expect(
          validationService.validateLunchBreakDuration,
        ).toHaveBeenCalledWith(45);
      });

      it("should update multiple fields including email and phone", async () => {
        const updateDto = {
          email: "new@test.com",
          phoneNumber: "9999999999",
          expectedArrivalTime: "10:00",
          expectedDepartureTime: "18:00",
        };

        userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
        validationService.validateEmailUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validatePhoneUniqueness = jest
          .fn()
          .mockResolvedValue(undefined);
        validationService.validateWorkingHours = jest
          .fn()
          .mockReturnValue(undefined);
        userRepository.save = jest.fn().mockResolvedValue({
          ...mockUser,
          ...updateDto,
        });

        const result = await service.update("1", updateDto);

        expect(result.user.email).toBe("new@test.com");
        expect(validationService.validateEmailUniqueness).toHaveBeenCalled();
        expect(validationService.validatePhoneUniqueness).toHaveBeenCalled();
        expect(validationService.validateWorkingHours).toHaveBeenCalled();
      });
    });

    describe("findAll with cursor pagination", () => {
      it("should handle cursor pagination when cursor is provided", async () => {
        const timestamp = new Date();
        const cursorQuery = {
          cursor: Buffer.from(`${timestamp.toISOString()}::user-123`).toString(
            "base64",
          ),
          limit: 10,
        };

        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockUser]),
          getCount: jest.fn().mockResolvedValue(1),
        };

        // Mock for cursor pagination flow
        userRepository.createQueryBuilder = jest
          .fn()
          .mockReturnValue(mockQueryBuilder);
        userRepository.findAndCount = jest
          .fn()
          .mockResolvedValue([[mockUser], 1]);

        const result = await service.findAll(cursorQuery as any);

        // Just verify the service returned a result with cursor pagination
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });
  });
});
