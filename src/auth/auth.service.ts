import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { sendEmail } from '../utils/mail.config';
import { LoginDto } from 'src/auth/dto/login.dto';
import { User } from 'src/users/schemas/user.schema';
import { BetterOmit } from 'src/utils/typescript.utils';

type UserWithoutComparePassword = BetterOmit<User, 'comparePassword'> & {
    _id: string;
};
type SanitizedUser = BetterOmit<UserWithoutComparePassword, 'hash' | 'salt' | 'password'>;

interface LoginTokenPayload extends SanitizedUser {
    sub: string;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        try {
            // Find user by email
            console.log('Validating user with email:', email);
            const user = await this.usersService.findByEmail(email);

            if (!user) {
                console.log('No user found with email:', email);
                throw new BadRequestException('Invalid email or password.');
            }

            console.log('User found:', {
                email: user.email,
                hasHash: !!user.hash
            });

            // Use the schema's comparePassword method
            const isMatch = await user.comparePassword(password);
            console.log('Password match result:', isMatch);

            // Return user without sensitive data if password matches
            if (isMatch) {
                console.log('Password matched successfully');
                const userObject = user.toObject();
                delete userObject.hash;
                delete userObject.salt;
                delete userObject.password;
                return userObject;
            }

            console.log('Password did not match');
            throw new BadRequestException('Invalid email or password.');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Validate user and get user data after removing sensitive information
     */
    private async validateAndGetUserData_v1(loginDto: LoginDto) {

        // Check if user exists
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(loginDto.password);
        if (!isMatch) {
            throw new BadRequestException('Invalid email or password.');
        }

        // Remove sensitive information
        const userObject = user.toObject<UserWithoutComparePassword>();
        const { hash, salt, password, ...userObjectWithoutSensitiveData } = userObject;

        return userObjectWithoutSensitiveData;

    }

    /**
     * Tokenize the received user object and create a JWT token based on JWT standard
     */
    private async tokenizeUser_v1(user: SanitizedUser) {
        const payload: LoginTokenPayload = {
            sub: user._id,
            ...user
        };

        // Create JWT token
        return this.jwtService.sign(payload);
    }

    /**
     * Validate the received JWT token and return the payload
     */
    async validateToken_v1(token: string) {
        const payload = this.jwtService.verify<LoginTokenPayload>(token);
        return payload;
    }

    /**
     * Login user and return the token
     */
    async login_v1(loginDto: LoginDto) {

        // Validate user and get user data
        const sanitizedUser = await this.validateAndGetUserData_v1(loginDto);

        // Tokenize user
        const token = await this.tokenizeUser_v1(sanitizedUser);

        return {
            token,
            userId: sanitizedUser._id,
            username: sanitizedUser.email,
        };
    }

    async login(user: any) {
        // Create JWT payload
        const payload = {
            id: user._id,
            collection: 'users',
            email: user.email,
            user_type: user.user_type
        };

        // Generate token with 7-day expiry
        const token = this.jwtService.sign(payload, {
            expiresIn: '7d' // Review: why is 7d specified here when it's already specified in the auth.module.ts?
        });

        // Calculate expiry timestamp for response
        const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

        // Get creator info if available
        let createdBy = null;
        if (user.createdBy) {
            try {
                const creator = await this.usersService.findById(user.createdBy);
                if (creator) {
                    createdBy = {
                        id: creator._id,
                        first_name: creator.first_name,
                        last_name: creator.last_name,
                        phone_number: creator.phone_number,
                        user_type: creator.user_type,
                        created_at: creator.created_at,
                        _verified: creator._verified,
                        email: creator.email,
                        educational_backgrounds: creator.educational_backgrounds || [],
                        national_id_card: creator.national_id_card || {},
                        isProfileCompleted: creator.isProfileCompleted || false,
                        current_stage: creator.current_stage || 0,
                        verifyToken: creator.verifyToken || '',
                        loginAttempts: creator.loginAttempts || 0
                    };
                }
            } catch (error) {
                console.error('Error fetching creator info:', error);
            }
        }

        // Format response to match required structure
        return {
            exp: expiry,
            message: "Auth Passed",
            token,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type,
                educational_backgrounds: user.educational_backgrounds || [],
                national_id_card: user.national_id_card || {},
                created_at: user.createdAt || user.created_at,
                _verified: user._verified || false,
                isProfileCompleted: user.isProfileCompleted || false,
                createdBy,
                campus_id: user?.campus_id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                current_stage: user.current_stage || 0,
                verifyToken: user.verifyToken || '',
                loginAttempts: user.loginAttempts || 0
            }
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
        const resetPasswordExpiration = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Update user with reset token and expiration
        await this.usersService.updateUser(user._id.toString(), {
            resetPasswordToken,
            resetPasswordExpiration
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
                    `
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
                resetPasswordExpiration: undefined
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
            new Date()
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
            resetPasswordExpiration: undefined
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
            verifyToken: ''
        });

        return { success: true, message: 'Email verified successfully' };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
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
            salt: null // PayloadCMS style
        });

        return { success: true, message: 'Password changed successfully' };
    }
}
