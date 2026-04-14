import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, ResetPasswordDto } from './auth.dto';
import { DbLoggerService } from '../../observability/logger/db-logger.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly dbLogger: DbLoggerService,
  ) {}

  async register(registerDto: RegisterDto, ip?: string, ua?: string) {
    try {
      this.dbLogger.log(`Registration attempt: ${registerDto.email}`, 'Auth');
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = await this.usersService.createUser({
        email: registerDto.email,
        passwordHash: hashedPassword,
        name: registerDto.name,
        wardrobe: { create: {} }
      });

      const tokens = await this.issueNewSession(user.id, user.email, user.role, ip, ua);
      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...tokens
      };
    } catch (error) {
      this.dbLogger.error(`Registration failed: ${error.message}`, error.stack, 'Auth');
      throw error;
    }
  }

  async login(loginDto: LoginDto, ip?: string, ua?: string) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.issueNewSession(user.id, user.email, user.role, ip, ua);
      this.dbLogger.log(`Login successful: ${loginDto.email}`, 'Auth');
      
      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...tokens
      };
    } catch (error) {
      this.dbLogger.error(`Login error: ${error.message}`, error.stack, 'Auth');
      throw error;
    }
  }

  async refreshTokens(refreshToken: string, ip?: string, ua?: string) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecret123';
      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
      
      const tokenHash = this.hashToken(refreshToken);
      const session = await this.prisma.refreshSession.findUnique({
        where: { tokenHash },
        include: { user: true }
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        // If session exists but is revoked, it might be a reuse attack
        if (session) {
            await this.revokeAllUserSessions(session.userId);
            this.dbLogger.warn(`Potential Refresh Token Reuse Attack detected for user ${session.userId}. All sessions revoked.`, 'Auth');
        }
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Rotate: Delete old session and issue new ones
      await this.prisma.refreshSession.delete({ where: { id: session.id } });
      
      return this.issueNewSession(session.user.id, session.user.email, session.user.role, ip, ua);
    } catch (error) {
      throw new UnauthorizedException('Session verification failed');
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshSession.deleteMany({ where: { tokenHash } });
    return { success: true };
  }

  private async issueNewSession(userId: string, email: string, role: string, ip?: string, ua?: string) {
    const payload = { sub: userId, email, role };
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecret123';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { 
        expiresIn: '15m',
        secret: this.configService.get<string>('JWT_SECRET')
      }),
      this.jwtService.signAsync(payload, { 
        expiresIn: '7d', 
        secret: refreshSecret 
      }),
    ]);

    // Store session in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        ipAddress: ip,
        deviceInfo: ua,
      }
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokeAllUserSessions(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
    // Actually delete them for clean DB, or keep as revoked for audit. Delete is safer for storage.
    await this.prisma.refreshSession.deleteMany({ where: { userId } });
  }

  // ... (forgotPassword and resetPassword remain similar, just ensuring they use dbLogger)
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'If account exists, link sent.' };
    const token = Math.random().toString(36).substring(2, 15);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    await this.usersService.updateResetToken(user.id, token, expires);
    this.dbLogger.log(`Password reset requested for ${email}`, 'Auth');
    return { message: 'Reset link generated.' };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetDto.token);
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    this.dbLogger.log(`Password reset success: ${user.id}`, 'Auth');
    return { message: 'Password reset successful.' };
  }
}
