import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

function extractCookieToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [rawKey, ...rawVal] = pair.trim().split('=');
    if (rawKey === 'auth_token' && rawVal.length > 0) {
      try {
        return decodeURIComponent(rawVal.join('='));
      } catch {
        return rawVal.join('=');
      }
    }
  }
  return null;
}

/**
 * Проверяет JWT-токен из защищенной HttpOnly cookie `auth_token`
 * (либо из заголовка Authorization: Bearer <token> для API-клиентов)
 * и помещает { id, role } в request.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const cookieToken: string | null =
      req.cookies?.auth_token ?? extractCookieToken(req.headers?.cookie);

    const [scheme, headerToken] = (req.headers?.authorization ?? '').split(' ');
    const bearerToken =
      scheme === 'Bearer' && headerToken && headerToken !== 'httponly-cookie-session'
        ? headerToken
        : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: number; role: string }>(token);
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
