import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class ManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { isManager?: boolean } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Utilisateur non authentifié");
    }

    if (!user.isManager) {
      throw new ForbiddenException("Accès réservé aux managers");
    }

    return true;
  }
}
