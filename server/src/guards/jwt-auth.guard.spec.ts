import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true for public routes", () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      const context = {
        getHandler: jest.fn().mockReturnValue(mockHandler),
        getClass: jest.fn().mockReturnValue(mockClass),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
        mockHandler,
        mockClass,
      ]);
    });

    it("should call super.canActivate for protected routes", () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: "Bearer token" },
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

      // Mock super.canActivate
      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        "canActivate",
      );
      superCanActivate.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
    });
  });

  describe("handleRequest", () => {
    it("should return user if authenticated", () => {
      const user = { id: "1", email: "test@example.com" };

      const result = guard.handleRequest(null, user, null, {} as any);

      expect(result).toEqual(user);
    });

    it("should throw UnauthorizedException if not authenticated", () => {
      expect(() => {
        guard.handleRequest(null, null, null, {} as any);
      }).toThrow(UnauthorizedException);
    });

    it("should throw error if provided", () => {
      expect(() => {
        guard.handleRequest(new UnauthorizedException("Auth error"), null, null, {} as any);
      }).toThrow(UnauthorizedException);
    });
  });
});
