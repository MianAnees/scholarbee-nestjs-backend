import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { IConfiguration } from 'src/config/configuration';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { BetterOmit } from 'src/utils/typescript.utils';
import { UsersService } from '../users/users.service';
import { sendEmail } from '../utils/mail.config';
import { AccessTokenPayload } from 'src/auth/types/auth.interface';
import { RefreshTokenPayload } from 'src/auth/types/auth.interface';

type UserWithoutComparePassword = BetterOmit<User, 'comparePassword'> & {
    _id: string;
};
export type SanitizedUser = BetterOmit<UserWithoutComparePassword, 'hash' | 'salt' | 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService<IConfiguration>,
  ) {}

  private async sanitizeUser(user: UserDocument): Promise<SanitizedUser> {
    const userObject = user.toObject<UserWithoutComparePassword>();
    const { hash, salt, password, ...userObjectWithoutSensitiveData } =
      userObject;

    return userObjectWithoutSensitiveData;
  }

  /**
   * Validate user and get user data after removing sensitive information
   */
  async validateAndGetUserData_v1(loginDto: LoginDto): Promise<SanitizedUser> {
    // Check if user exists
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(loginDto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const sanitizedUser = await this.sanitizeUser(user);
    return sanitizedUser;
  }

  /**
   * Tokenize the received user object and create a JWT token based on JWT standard
   */
  async generateTokens(user: SanitizedUser) {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user._id,
      userId: user._id,
      ...user,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user._id,
      sub: user._id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get('jwt.loginSecret', { infer: true }),
        expiresIn: `${this.configService.get('jwt.loginExpiration', { infer: true })}s`,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
        expiresIn: `${this.configService.get('jwt.refreshExpiration', { infer: true })}s`,
      }),
    ]);

    // Create JWT token
    return {
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: string, token: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Compare the hash of the refresh token
    // const isRefreshTokenMatch = await argon2.verify(user.refreshTokenHash, token);
    const isRefreshTokenMatch = await bcrypt.compare(
      token,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }

  // V2: Passport Local Strategy validation
  async validateUser(email: string, password: string): Promise<any> {
    // You can customize this logic for v2 as needed
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return null;
    // Remove sensitive info for v2
    const userObject = user.toObject();
    delete userObject.hash;
    delete userObject.salt;
    delete userObject.password;
    return userObject;
  }

  /**
   * Receives the validated user and transforms it into a token
   */
  async login(user: SanitizedUser) {
    // Tokenize user
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // hash and save refresh token
    // const refreshTokenHash = await argon2.hash(refreshToken);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateUser(user._id, { refreshTokenHash });
    console.log(` refreshToken & Hash:`, { refreshToken, refreshTokenHash });

    return {
      token: accessToken, // for backward compatibility
      accessToken,
      refreshToken,
      userId: user._id,
      username: user.email,
    };
  }

  async logout(user: SanitizedUser) {
    // Revoke the refresh token
    await this.usersService.updateUser(user._id, { refreshTokenHash: null });
    return { message: 'Successfully signed out' };
  }

  async refreshToken(user: UserDocument) {
    const sanitizedUser = await this.sanitizeUser(user);

    const { accessToken, refreshToken } =
      await this.generateTokens(sanitizedUser);

    // BUG: Using bcrypt was giving unexpected results
    // const refreshTokenHash = await argon2.hash(refreshToken);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateUser(sanitizedUser._id, { refreshTokenHash });

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      userId: user._id,
      username: user.email,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration (10 minutes)
    const resetPasswordExpiration = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with reset token and expiration
    await this.usersService.updateUser(user._id.toString(), {
      resetPasswordToken,
      resetPasswordExpiration,
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      try {
        await sendEmail({
          from: process.env.DEFAULT_FROM_EMAIL || 'noreply@scholarbee.pk',
          to: user.email,
          subject: 'Password Reset Request',
          html: `
                        <h1>Password Reset</h1>
                        <p>You requested a password reset. Please click the link below to reset your password:</p>
                        <a href="${resetUrl}" target="_blank">Reset Password</a>
                        <p>This link will expire in 10 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    `,
        });
      } catch (emailError) {
        console.error('Failed to send email via primary method:', emailError);
        // Log the reset URL for testing purposes
        console.log('Password reset URL (for testing):', resetUrl);
      }

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      // If email fails, remove reset token from user
      await this.usersService.updateUser(user._id.toString(), {
        resetPasswordToken: undefined,
        resetPasswordExpiration: undefined,
      });

      throw new Error('Error sending password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the token to compare with stored token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and valid expiration
    const user = await this.usersService.findByResetToken(
      resetPasswordToken,
      new Date(),
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update user with new password and clear reset token
    await this.usersService.updateUser(user._id.toString(), {
      hash,
      salt: null, // PayloadCMS style
      resetPasswordToken: undefined,
      resetPasswordExpiration: undefined,
    });

    return { success: true, message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerifyToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Update user as verified
    await this.usersService.updateUser(user._id.toString(), {
      _verified: true,
      verifyToken: '',
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password using the schema method
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update user with new password
    await this.usersService.updateUser(user._id.toString(), {
      hash,
      salt: null, // PayloadCMS style
    });

    return { success: true, message: 'Password changed successfully' };
  }
}
