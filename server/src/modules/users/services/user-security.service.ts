import { Injectable, ForbiddenException, Logger } from "@nestjs/common";
import { User, UserRole } from "../entities/user.entity";

@Injectable()
export class UserSecurityService {
  private readonly logger = new Logger(UserSecurityService.name);

  /**
   * Vérifie si un utilisateur peut modifier un profil
   */
  canUpdateProfile(targetUserId: string, requestUser?: User): void {
    if (!requestUser) {
      throw new ForbiddenException("Authentication required");
    }

    const isOwnProfile = requestUser.id === targetUserId;
    const isPrivileged = this.isManagerOrAdmin(requestUser);

    if (!isOwnProfile && !isPrivileged) {
      throw new ForbiddenException("You can only update your own profile");
    }
  }

  /**
   * Vérifie si un utilisateur peut changer un mot de passe
   */
  canChangePassword(targetUserId: string, requestUser?: User): void {
    if (!requestUser) {
      throw new ForbiddenException("Authentication required");
    }

    const isOwnProfile = requestUser.id === targetUserId;
    const isAdmin = requestUser.role === UserRole.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenException("You can only change your own password");
    }
  }

  /**
   * Vérifie si un utilisateur peut supprimer un autre utilisateur
   */
  canDeleteUser(targetUser: User, requestUser?: User): void {
    if (!requestUser) {
      throw new ForbiddenException("Authentication required");
    }

    if (requestUser.role === UserRole.USER) {
      throw new ForbiddenException("You don't have permission to delete users");
    }

    if (requestUser.role === UserRole.MANAGER && targetUser.role === UserRole.ADMIN) {
      throw new ForbiddenException("Managers cannot delete admin users");
    }
  }

  /**
   * Détermine le rôle à assigner en fonction des permissions
   */
  determineAssignableRole(requestedRole: UserRole, requestUser?: User): UserRole {
    if (!requestUser) {
      return UserRole.USER;
    }

    if (requestedRole === UserRole.ADMIN) {
      return this.handleAdminRoleAssignment(requestUser);
    }

    if (requestUser.role === UserRole.MANAGER) {
      return this.handleManagerRoleAssignment(requestedRole);
    }

    if (requestUser.role === UserRole.ADMIN) {
      return requestedRole;
    }

    return UserRole.USER;
  }

  /**
   * Gère l'assignation du rôle ADMIN
   */
  private handleAdminRoleAssignment(requestUser: User): UserRole {
    if (requestUser.role !== UserRole.ADMIN) {
      this.logger.warn(
        `User ${requestUser.id} attempted to create ADMIN without permission`
      );
      return UserRole.USER;
    }
    return UserRole.ADMIN;
  }

  /**
   * Gère l'assignation de rôle par un MANAGER
   */
  private handleManagerRoleAssignment(requestedRole: UserRole): UserRole {
    return requestedRole === UserRole.ADMIN ? UserRole.USER : requestedRole;
  }

  /**
   * Vérifie si un utilisateur est MANAGER ou ADMIN
   */
  private isManagerOrAdmin(user: User): boolean {
    return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
  }
}