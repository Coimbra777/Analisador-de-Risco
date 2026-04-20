import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AUTH_MESSAGES } from '../http/api-messages';
import { JwtUserPayload } from './jwt-user-payload.interface';

type AuthenticatedRequest = Request & {
  user?: JwtUserPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_MESSAGES.MISSING_BEARER_TOKEN);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(token);
      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
