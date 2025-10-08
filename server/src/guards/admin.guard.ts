import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { isAdmin?: boolean } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Utilisateur non authentifié");
    }

    if (!user || !user.isAdmin) {
      throw new UnauthorizedException("Accès réservé aux administrateurs");
    }

    return true;
  }
}
