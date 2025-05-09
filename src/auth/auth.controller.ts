import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService, SanitizedUser } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { ResourceProtectionGuard } from './guards/resource-protection.guard';
import { RefreshAuthenticationGuard } from 'src/auth/guards/refresh-authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthenticationGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login_v2(@Request() req) {
    // REVIEW: How to add type here

    return this.authService.login(req.user);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout_v2(@Request() req) {
    return this.authService.logout(req.user);
  }

  @UseGuards(RefreshAuthenticationGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() signupDto: SignupDto) {
    return this.usersService.create(signupDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetPasswordDto.password);
  }

  @Get('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get('debug-hash/:email')
  async debugHash(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      email: user.email,
      hashType: user.hash?.substring(0, 10) + '...',
      hasSalt: !!user.salt,
      saltType: user.salt ? user.salt.substring(0, 10) + '...' : 'none',
    };
  }
} 