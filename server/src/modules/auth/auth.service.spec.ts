import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: "1",
    email: "test@example.com",
    password: "$2b$10$hashedpassword",
    role: "user",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+33123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("signIn", () => {
    it("should return access token and user data on valid credentials", async () => {
      const email = "test@example.com";
      const password = "password123";
      const token = "jwt.token.here";

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);

      const result = await service.signIn(email, password);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it("should throw UnauthorizedException when user not found", async () => {
      usersService.findByEmail.mockResolvedValue(undefined as any);

      await expect(service.signIn("wrong@email.com", "password")).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith("wrong@email.com");
    });

    it("should throw UnauthorizedException when password is invalid", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn("test@example.com", "wrongpassword"),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", mockUser.password);
    });

    it("should handle unexpected errors", async () => {
      usersService.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(service.signIn("test@example.com", "password")).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe("validateUser", () => {
    it("should return user when valid id is provided", async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.validateUser("1");

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith("1");
    });

    it("should handle errors when validating user", async () => {
      usersService.findOne.mockRejectedValue(new Error("User not found"));

      await expect(service.validateUser("invalid-id")).rejects.toThrow(HttpException);
    });

    it("should propagate HttpException errors", async () => {
      const httpError = new UnauthorizedException("User not found");
      usersService.findOne.mockRejectedValue(httpError);

      await expect(service.validateUser("1")).rejects.toThrow(UnauthorizedException);
    });
  });
});
