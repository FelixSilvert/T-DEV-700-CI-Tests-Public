import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";
import { UsersService } from "../../users/users.service";
import { UserRole } from "../../users/entities/user.entity";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: UserRole.USER,
    firstName: "John",
    lastName: "Doe",
    password: "hashedPassword",
    phoneNumber: "+33123456789",
    IDTeam: null,
    expectedArrivalTime: "09:00",
    expectedDepartureTime: "17:00",
    lunchBreakDuration: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue("test-secret-key"),
    };

    const mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should throw an error if JWT_SECRET is not set", () => {
    const mockConfigServiceNoSecret = {
      get: jest.fn().mockReturnValue(undefined),
    };

    expect(() => {
      new JwtStrategy(
        mockConfigServiceNoSecret as any,
        usersService as any,
      );
    }).toThrow("JWT_SECRET environment variable is not set");
  });

  describe("validate", () => {
    it("should validate and return user payload", async () => {
      const payload = { sub: "user-1", email: "test@example.com" };
      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const payload = { sub: "invalid-id", email: "test@example.com" };
      usersService.findOne.mockRejectedValue(new Error("User not found"));

      await expect(strategy.validate(payload)).rejects.toThrow();
    });

    it("should handle UnauthorizedException when user is invalid", async () => {
      const payload = { sub: "invalid-id", email: "test@example.com" };
      
      // Mock findOne pour qu'il ne trouve pas d'utilisateur et retourne undefined
      // Ce qui déclenchera l'UnauthorizedException dans validate()
      usersService.findOne.mockImplementation(async () => {
        return undefined as any;
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        "Utilisateur non trouvé",
      );
    });
  });
});
