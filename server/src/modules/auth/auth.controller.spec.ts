import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signIn: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signIn", () => {
    it("should sign in a user successfully", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "password123",
      };
      const expectedResult = {
        access_token: "jwt-token",
        user: {
          id: "user-1",
          email: "test@example.com",
          role: "user",
          firstName: "John",
          lastName: "Doe",
        },
      };

      authService.signIn.mockResolvedValue(expectedResult as any);

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
