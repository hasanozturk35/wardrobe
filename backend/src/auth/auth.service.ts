import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto, ResetPasswordDto } from './auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }
    async register(registerDto: RegisterDto) {
        try {
            console.log('[Auth] Registration attempt for email:', registerDto.email);
            const existingUser = await this.usersService.findByEmail(registerDto.email);
            if (existingUser) {
                console.warn('[Auth] Email already exists:', registerDto.email);
                throw new UnauthorizedException('Email already exists');
            }

            console.log('[Auth] Hashing password...');
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            
            console.log('[Auth] Creating user and wardrobe in DB...');
            
            // Check if this is the first user or has admin email (case-insensitive)
            const userCount = await this.usersService.count();
            const role = (userCount === 0 || registerDto.email.toLowerCase().startsWith('admin@')) ? 'ADMIN' : 'USER';

            const user = await this.usersService.createUser({
                email: registerDto.email,
                passwordHash: hashedPassword,
                name: registerDto.name,
                role: role as any,
                wardrobe: {
                    create: {}
                }
            });

            console.log('[Auth] User created successfully. Generating tokens...');
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                ...tokens
            };
        } catch (error) {
            console.error('[Auth] Registration failed with error:', error);
            // Re-throw if it's already a Nest exception, otherwise wrap it
            if (error instanceof UnauthorizedException) throw error;
            throw new Error(`Registration failed: ${error.message}`);
        }
    }
    async login(loginDto: LoginDto) {
        try {
            console.log('[Auth] Login attempt for email:', loginDto.email);
            
            const user = await this.usersService.findByEmail(loginDto.email);
            if (!user) {
                console.warn('[Auth] Login failed: User not found for email:', loginDto.email);
                throw new UnauthorizedException('Invalid credentials');
            }

            console.log('[Auth] Found user, comparing passwords...');
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
            
            if (!isPasswordValid) {
                console.warn('[Auth] Login failed: Invalid password for email:', loginDto.email);
                throw new UnauthorizedException('Invalid credentials');
            }

            console.log('[Auth] Password valid. Checking for role elevation...');
            
            let userRole = user.role;
            if (loginDto.email.toLowerCase().startsWith('admin@') && user.role !== 'ADMIN') {
                console.log('[Auth] Elevating user to ADMIN based on email prefix (case-insensitive)');
                const updatedUser = await this.usersService.updateRole(user.id, 'ADMIN');
                userRole = updatedUser.role;
            }

            console.log('[Auth] Generating tokens...');
            const tokens = await this.generateTokens(user.id, user.email, userRole);
            
            console.log('[Auth] Login successful for:', loginDto.email);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: userRole,
                },
                ...tokens
            };
        } catch (error) {
            console.error('[Auth] Login CRITICAL ERROR:', error);
            if (error instanceof UnauthorizedException) throw error;
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Güvenlik için kullanıcı yoksa da "gönderildi" diyebiliriz ama MVP için hata verelim veya loglayalım
            console.warn('[Auth] Forgot password requested for non-existent email:', email);
            return { message: 'If an account exists with this email, a reset link has been sent.' };
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 saat geçerli

        await this.usersService.updateResetToken(user.id, token, expires);

        // MOCK EMAIL SENDING
        console.log('------------------------------------------');
        console.log('PASSWORD RESET LINK (MOCK EMAIL):');
        console.log(`URL: http://localhost:5174/reset-password?token=${token}`);
        console.log('------------------------------------------');

        return { message: 'Reset link has been generated and logged to terminal.' };
    }

    async resetPassword(resetDto: ResetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetDto.token);
        
        if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);
        await this.usersService.updatePassword(user.id, hashedPassword);

        return { message: 'Password has been reset successfully.' };
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '15m' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refreshSecret123' }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }
}
