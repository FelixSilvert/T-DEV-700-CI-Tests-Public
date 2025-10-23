import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { UserValidationService } from "./user-validation.service";
import { User, UserRole } from "../entities/user.entity";

describe("UserValidationService", () => {
  let service: UserValidationService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: Partial<User> = {
    id: "user-1",
    email: "test@example.com",
    phoneNumber: "+33123456789",
    role: UserRole.USER,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserValidationService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserValidationService>(UserValidationService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateEmailUniqueness", () => {
    it("should pass if email is unique", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateEmailUniqueness("unique@example.com"),
      ).resolves.not.toThrow();
      
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: "unique@example.com" },
      });
    });

    it("should throw ConflictException if email already exists", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.validateEmailUniqueness("test@example.com"),
      ).rejects.toThrow(ConflictException);
    });

    it("should pass if email belongs to the user being updated", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.validateEmailUniqueness("test@example.com", "user-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("validatePhoneUniqueness", () => {
    it("should pass if phone number is unique", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validatePhoneUniqueness("+33987654321"),
      ).resolves.not.toThrow();

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { phoneNumber: "+33987654321" },
      });
    });

    it("should throw ConflictException if phone number already exists", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.validatePhoneUniqueness("+33123456789"),
      ).rejects.toThrow(ConflictException);
    });

    it("should pass if phone belongs to the user being updated", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.validatePhoneUniqueness("+33123456789", "user-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("validateWorkingHours", () => {
    it("should pass with valid work hours", () => {
      expect(() =>
        service.validateWorkingHours({
          arrivalTime: "09:00",
          departureTime: "17:00",
        }),
      ).not.toThrow();
    });

    it("should throw BadRequestException if work duration is too short", () => {
      expect(() =>
        service.validateWorkingHours({
          arrivalTime: "09:00",
          departureTime: "11:00",
        }),
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException if departure is before arrival", () => {
      expect(() =>
        service.validateWorkingHours({
          arrivalTime: "17:00",
          departureTime: "09:00",
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe("validateLunchBreakDuration", () => {
    it("should pass with valid lunch break duration", () => {
      expect(() => service.validateLunchBreakDuration(60)).not.toThrow();
    });

    it("should throw BadRequestException if lunch break is too short", () => {
      expect(() => service.validateLunchBreakDuration(10)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if lunch break is too long", () => {
      expect(() => service.validateLunchBreakDuration(200)).toThrow(
        BadRequestException,
      );
    });
  });
});
