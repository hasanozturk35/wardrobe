import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'superSecretKey',
    });
  }

  async validate(payload: any) {
    // Basic validation from payload
    if (!payload.sub) {
        throw new UnauthorizedException();
    }
    
    // Optional: Deep validation against DB for production-grade
    // For performance, we often trust the token, but for high-security 
    // we can check if the user is still active.
    return { 
        userId: payload.sub, 
        email: payload.email, 
        role: payload.role 
    };
  }
}
