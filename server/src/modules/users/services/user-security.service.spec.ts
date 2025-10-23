import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { UserSecurityService } from "./user-security.service";
import { User, UserRole } from "../entities/user.entity";

describe("UserSecurityService", () => {
  let service: UserSecurityService;

  const mockAdminUser: Partial<User> = {
    id: "admin-1",
    email: "admin@example.com",
    role: UserRole.ADMIN,
  };

  const mockManagerUser: Partial<User> = {
    id: "manager-1",
    email: "manager@example.com",
    role: UserRole.MANAGER,
  };

  const mockRegularUser: Partial<User> = {
    id: "user-1",
    email: "user@example.com",
    role: UserRole.USER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSecurityService],
    }).compile();

    service = module.get<UserSecurityService>(UserSecurityService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("canUpdateProfile", () => {
    it("should allow user to update own profile", () => {
      expect(() =>
        service.canUpdateProfile("user-1", mockRegularUser as User),
      ).not.toThrow();
    });

    it("should allow admin to update any profile", () => {
      expect(() =>
        service.canUpdateProfile("user-1", mockAdminUser as User),
      ).not.toThrow();
    });

    it("should allow manager to update any profile", () => {
      expect(() =>
        service.canUpdateProfile("user-1", mockManagerUser as User),
      ).not.toThrow();
    });

    it("should throw ForbiddenException if user tries to update another profile", () => {
      expect(() =>
        service.canUpdateProfile("other-user", mockRegularUser as User),
      ).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if no request user", () => {
      expect(() => service.canUpdateProfile("user-1")).toThrow(
        ForbiddenException,
      );
    });
  });

  describe("canChangePassword", () => {
    it("should allow user to change own password", () => {
      expect(() =>
        service.canChangePassword("user-1", mockRegularUser as User),
      ).not.toThrow();
    });

    it("should allow admin to change any password", () => {
      expect(() =>
        service.canChangePassword("user-1", mockAdminUser as User),
      ).not.toThrow();
    });

    it("should throw ForbiddenException if regular user tries to change another password", () => {
      expect(() =>
        service.canChangePassword("other-user", mockRegularUser as User),
      ).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if manager tries to change another password", () => {
      expect(() =>
        service.canChangePassword("other-user", mockManagerUser as User),
      ).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if no request user", () => {
      expect(() => service.canChangePassword("user-1")).toThrow(
        ForbiddenException,
      );
    });
  });

  describe("canDeleteUser", () => {
    it("should allow admin to delete users", () => {
      expect(() =>
        service.canDeleteUser(mockRegularUser as User, mockAdminUser as User),
      ).not.toThrow();
    });

    it("should allow manager to delete regular users", () => {
      expect(() =>
        service.canDeleteUser(mockRegularUser as User, mockManagerUser as User),
      ).not.toThrow();
    });

    it("should throw ForbiddenException if regular user tries to delete", () => {
      const targetUser = { ...mockRegularUser, id: "other-user" };
      expect(() =>
        service.canDeleteUser(targetUser as User, mockRegularUser as User),
      ).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if manager tries to delete admin", () => {
      expect(() =>
        service.canDeleteUser(mockAdminUser as User, mockManagerUser as User),
      ).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if no request user", () => {
      expect(() => service.canDeleteUser(mockRegularUser as User)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe("determineAssignableRole", () => {
    it("should return USER role if no request user", () => {
      const result = service.determineAssignableRole(UserRole.ADMIN);
      expect(result).toBe(UserRole.USER);
    });

    it("should allow admin to assign admin role", () => {
      const result = service.determineAssignableRole(UserRole.ADMIN, mockAdminUser as User);
      expect(result).toBe(UserRole.ADMIN);
    });

    it("should allow admin to assign manager role", () => {
      const result = service.determineAssignableRole(UserRole.MANAGER, mockAdminUser as User);
      expect(result).toBe(UserRole.MANAGER);
    });

    it("should not allow manager to assign admin role", () => {
      const result = service.determineAssignableRole(UserRole.ADMIN, mockManagerUser as User);
      expect(result).not.toBe(UserRole.ADMIN);
    });
  });
});
