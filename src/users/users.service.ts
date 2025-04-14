import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { sendEmail } from '../utils/mail.config';
import { UpdateNationalIdCardDto } from 'src/users/dto/update-nic.dto';
import { CreateNationalIdCardDto } from 'src/users/dto/create-nic.dto';
import { CreateEducationalBackgroundDto } from 'src/users/dto/create-educational-bg.dto';
import { UpdateEducationalBackgroundDto } from 'src/users/dto/update-educational-bg.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async create(createUserDto: any): Promise<any> {
        const { email, password, first_name, last_name, phone_number, user_type } = createUserDto;

        try {
            // Check if a user with this email already exists
            const existingUser = await this.findByEmail(email);

            if (existingUser) {
                // If the user exists but is not verified, resend the verification link
                if (!existingUser._verified) {
                    // TODO: shouldn't we use the generateVerificationToken function here?
                    const newVerifyToken = crypto.randomBytes(20).toString('hex');

                    await this.updateUser(existingUser._id.toString(), {
                        verifyToken: newVerifyToken,
                        _verified: false
                    });

                    const verificationUrl = `${process.env.FRONTEND_URL}/verification/${newVerifyToken}`;

                    await sendEmail({
                        from: 'no-reply@scholarbee.pk',
                        to: existingUser.email,
                        subject: 'Verify Your Email Address',
                        html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verification Link</a></p>`,
                    });

                    return {
                        message: 'User already exists but is not verified. A new verification link has been sent to your email.',
                        user: {
                            id: existingUser._id,
                            email: existingUser.email,
                            first_name: existingUser.first_name,
                            last_name: existingUser.last_name
                        }
                    };
                }

                // If the user is already verified, do not allow duplicate signups
                throw new ConflictException('Email already exists.');
            }

            // If no existing user, create a new user
            // Hash the password using bcrypt (same as PayloadCMS)
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Generate verification token
            const verifyToken = crypto.randomBytes(20).toString('hex');

            // Create new user with the hashed password
            const newUser = new this.userModel({
                email,
                hash,  // Store the bcrypt hash
                salt: null,  // PayloadCMS doesn't use a separate salt field with bcrypt
                first_name,
                last_name,
                phone_number,
                user_type,
                verifyToken,
                _verified: false,
                created_at: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const savedUser = await newUser.save();

            // Send verification email
            const verificationUrl = `${process.env.FRONTEND_URL}/verification/${verifyToken}`;

            await sendEmail({
                from: 'no-reply@scholarbee.pk',
                to: savedUser.email,
                subject: 'Verify Your Email Address',
                html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verification Link</a></p>`,
            });

            return {
                message: 'Verification link sent to your email successfully.',
                user: {
                    id: savedUser._id,
                    email: savedUser.email,
                    first_name: savedUser.first_name,
                    last_name: savedUser.last_name

                }
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            console.error('Signup error:', error);
            throw new BadRequestException('Failed to complete signup.');
        }
    }

    async findAll(query: any = {}): Promise<{ docs: User[]; totalDocs: number; page: number; totalPages: number }> {
        const take = query.limit || 10;
        const skip = (query.page - 1) * take || 0;
        const page = query.page || 1;

        // Build filter conditions
        let filter: any = {};

        if (query.user_type) {
            filter.user_type = query.user_type;
        }

        if (query.search) {
            filter.$or = [
                { first_name: { $regex: query.search, $options: 'i' } },
                { last_name: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } },
            ];
        }

        const totalDocs = await this.userModel.countDocuments(filter);
        const docs = await this.userModel
            .find(filter)
            .select('-password -salt')
            .skip(skip)
            .limit(take)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(totalDocs / take);

        return {
            docs,
            totalDocs,
            page,
            totalPages,
        };
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            updateUserDto,
            { new: true }
        ).select('-password -salt');

        if (!updatedUser) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return updatedUser;
    }

    async remove(id: string): Promise<void> {
        const result = await this.userModel.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    // Review: This function is not used anywhere. Should we remove it?
    async generateVerificationToken(): Promise<string> {
        return crypto.randomBytes(20).toString('hex');
    }

    async setVerificationToken(userId: string, token: string): Promise<void> {
        await this.userModel.updateOne(
            { _id: userId },
            { verifyToken: token, _verified: false }
        );
    }

    async verifyEmail(token: string): Promise<User> {
        const user = await this.userModel.findOne({ verifyToken: token });
        if (!user) {
            throw new NotFoundException('Invalid verification token');
        }

        user.verifyToken = '';
        user._verified = true;
        return user.save();
    }

    async generateResetPasswordToken(email: string): Promise<{ token: string; user: User }> {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpiration = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        return { token, user };
    }

    async resetPassword(token: string, newPassword: string): Promise<User> {
        const user = await this.userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpiration: { $gt: Date.now() },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired token');
        }

        user.password = newPassword; // Review: should we hash the password here?
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiration = undefined;
        return user.save();
    }

    async addEducationalBackground(userId: string, payload: CreateEducationalBackgroundDto): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.educational_backgrounds) {
            user.educational_backgrounds = [];
        }

        // Generate a unique ID for this educational background
        payload.id = crypto.randomBytes(12).toString('hex');

        user.educational_backgrounds.push(payload);
        return user.save();
    }

    async addNationalIdCard(userId: string, payload: CreateNationalIdCardDto): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const { national_id_card, isProfileCompleted } = payload;

        // TODO: Check if validation for both these properties is in-place
        user.national_id_card = national_id_card;
        user.isProfileCompleted = isProfileCompleted;

        return user.save();
    }

    async updateEducationalBackground(userId: string, backgroundId: string, payload: UpdateEducationalBackgroundDto): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.educational_backgrounds) {
            throw new NotFoundException('No educational backgrounds found');
        }

        const index = user.educational_backgrounds.findIndex(bg => bg.id === backgroundId);
        if (index === -1) {
            throw new NotFoundException(`Educational background with ID ${backgroundId} not found`);
        }

        user.educational_backgrounds[index] = {
            ...user.educational_backgrounds[index],
            ...payload,
            marks_gpa: {
                ...user.educational_backgrounds[index].marks_gpa,
                ...payload.marks_gpa
            }
        };

        return user.save();
    }

    async removeEducationalBackground(userId: string, backgroundId: string): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.educational_backgrounds) {
            throw new NotFoundException('No educational backgrounds found');
        }

        const initialLength = user.educational_backgrounds.length;
        user.educational_backgrounds = user.educational_backgrounds.filter(bg => bg.id !== backgroundId);

        if (user.educational_backgrounds.length === initialLength) {
            throw new NotFoundException(`Educational background with ID ${backgroundId} not found`);
        }

        return user.save();
    }

    async updateNationalIdCard(userId: string, payload: UpdateNationalIdCardDto): Promise<User> {

        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        user.national_id_card = payload;
        return user.save();
    }

    async findById(id: string): Promise<UserDocument> {
        return this.userModel.findById(id).exec();
    }

    async updateUser(id: string, updateData: any): Promise<UserDocument> {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async findByResetToken(token: string, date: Date): Promise<UserDocument> {
        return this.userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpiration: { $gt: date }
        }).exec();
    }

    async findByVerifyToken(token: string): Promise<UserDocument> {
        return this.userModel.findOne({ verifyToken: token }).exec();
    }
} 