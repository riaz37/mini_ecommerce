import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          console.log('Cookies in request:', request.cookies);
          const token = request?.cookies?.refresh_token;
          console.log('Extracted refresh token:', token ? 'Present' : 'Missing');
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    console.log('JWT Refresh Strategy: Validating token payload:', payload);
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      console.log('JWT Refresh Strategy: No refresh token found in cookies');
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const user = await this.authService.getUserById(payload.sub);

      if (!user) {
        console.log(`JWT Refresh Strategy: No user found for ID ${payload.sub}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      console.log(`JWT Refresh Strategy: User validated: ${user.email}`);
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } catch (error) {
      console.error('JWT Refresh Strategy validation error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
