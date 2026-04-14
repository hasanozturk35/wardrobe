import { Controller, Post, Body, HttpCode, HttpStatus, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: any) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.register(registerDto, ip, ua);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.login(loginDto, ip, ua);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    if (!refreshToken) throw new BadRequestException('Refresh token is required');
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.refreshTokens(refreshToken, ip, ua);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token is required');
    return this.authService.logout(refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
