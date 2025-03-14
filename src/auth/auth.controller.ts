import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, Param, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Request() req, @Body() loginDto: LoginDto) {
        console.log('Login attempt for:', loginDto.email);
        return this.authService.login(req.user);
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
        @Body() resetPasswordDto: ResetPasswordDto
    ) {
        return this.authService.resetPassword(token, resetPasswordDto.password);
    }

    @Get('verify/:token')
    async verifyEmail(@Param('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Request() req,
        @Body() changePasswordDto: ChangePasswordDto
    ) {
        return this.authService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword
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
            saltType: user.salt ? (user.salt.substring(0, 10) + '...') : 'none'
        };
    }

    @Post('direct-login')
    @HttpCode(HttpStatus.OK)
    async directLogin(@Body() loginDto: LoginDto) {
        console.log('Direct login attempt for:', loginDto.email);

        // Manually validate the user
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);

        // If validation passes, generate token and return response
        return this.authService.login(user);
    }
} 