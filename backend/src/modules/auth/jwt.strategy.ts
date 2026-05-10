import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
