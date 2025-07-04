import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Model, Types, UpdateQuery } from 'mongoose';
import { CampusAdminCacheService } from 'src/common/services/campus-admin-cache.service';
import { CreateEducationalBackgroundDto } from 'src/users/dto/create-educational-bg.dto';
import { CreateNationalIdCardDto } from 'src/users/dto/create-nic.dto';
import { UpdateEducationalBackgroundDto } from 'src/users/dto/update-educational-bg.dto';
import { UpdateNationalIdCardDto } from 'src/users/dto/update-nic.dto';
import { sendEmail } from '../utils/mail.config';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument, UserNS } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly campusAdminCacheService: CampusAdminCacheService,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { email, password, first_name, last_name, phone_number, user_type } =
      createUserDto;

    try {
      // Check if a user with this email already exists
      const existingUser = await this.findByEmail(email);

      if (existingUser) {
        // If the user exists but is not verified, resend the verification link
        if (!existingUser._verified) {
          // TODO: shouldn't we use the generateVerificationToken function here?
          const newVerifyToken = crypto.randomBytes(20).toString('hex');

          await this.userModel
            .findByIdAndUpdate(
              existingUser._id.toString(),
              {
                verifyToken: newVerifyToken,
                _verified: false,
              },
              { new: true },
            )
            .select('-password -salt');

          const verificationUrl = `${process.env.FRONTEND_URL}/verification/${newVerifyToken}`;

          await sendEmail({
            from: 'no-reply@scholarbee.pk',
            to: existingUser.email,
            subject: 'Verify Your Email Address',
            html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verification Link</a></p>`,
          });

          return {
            message:
              'User already exists but is not verified. A new verification link has been sent to your email.',
            user: {
              id: existingUser._id,
              email: existingUser.email,
              first_name: existingUser.first_name,
              last_name: existingUser.last_name,
            },
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
        hash, // Store the bcrypt hash
        salt: null, // PayloadCMS doesn't use a separate salt field with bcrypt
        first_name,
        last_name,
        phone_number,
        user_type,
        verifyToken,
        _verified: false,
        created_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
          last_name: savedUser.last_name,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Signup error:', error);
      throw new BadRequestException('Failed to complete signup.');
    }
  }

  async findAll(query: any = {}): Promise<{
    docs: User[];
    totalDocs: number;
    page: number;
    totalPages: number;
  }> {
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

  async update(id: string, updated_user_doc: UpdateQuery<User>): Promise<User> {
    // Fetch the old user to compare changes
    const oldUser = await this.userModel.findById(id);

    // Update the user
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updated_user_doc, { new: true })
      .select('-password -salt');

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Campus admin cache invalidation logic
    const oldCampusId = oldUser?.campus_id?.toString();
    const newCampusId = updatedUser?.campus_id?.toString();

    // if the campus_id changed, it means either admin status changed or campus_id changed
    // so we need to invalidate the cache for both old and new campus_id, but only if the campus_id is valid and non-empty
    if (oldCampusId !== newCampusId) {
      if (oldCampusId)
        this.campusAdminCacheService.invalidateCampusAdminsCache(oldCampusId);
      if (newCampusId)
        this.campusAdminCacheService.invalidateCampusAdminsCache(newCampusId);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    // Fetch the user before deletion
    const user = await this.userModel.findById(id);
    const result = await this.userModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // Invalidate campus admin cache if the deleted user was a campus admin
    if (user?.user_type === UserNS.UserType.Campus_Admin && user?.campus_id) {
      this.campusAdminCacheService.invalidateCampusAdminsCache(
        user.campus_id.toString(),
      );
    }
  }

  // Review: This function is not used anywhere. Should we remove it?
  async generateVerificationToken(): Promise<string> {
    return crypto.randomBytes(20).toString('hex');
  }

  async setVerificationToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { verifyToken: token, _verified: false },
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

  async generateResetPasswordToken(
    email: string,
  ): Promise<{ token: string; user: User }> {
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

  async addEducationalBackground(
    userId: string,
    payload: CreateEducationalBackgroundDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (
      !payload.marks_gpa.total_marks_gpa ||
      !payload.marks_gpa.obtained_marks_gpa
    ) {
      throw new BadRequestException(
        'total_marks_gpa and obtained_marks_gpa are required in marks_gpa',
      );
    }

    if (!user.educational_backgrounds) {
      user.educational_backgrounds = [];
    }

    const educationalBackgroundDoc = {
      _id: new Types.ObjectId(),
      ...payload,
    };

    user.educational_backgrounds.push(educationalBackgroundDoc);
    const savedUser = await user.save();
    const savedEducationBackgroundDocument =
      savedUser.educational_backgrounds[
        savedUser.educational_backgrounds.length - 1
      ];

    return savedEducationBackgroundDocument;
  }

  async addNationalIdCard(
    userId: string,
    payload: CreateNationalIdCardDto,
  ): Promise<User> {
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

  async updateEducationalBackground(
    userId: string,
    backgroundId: string,
    payload: UpdateEducationalBackgroundDto,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.educational_backgrounds) {
        throw new NotFoundException('No educational backgrounds found');
      }

      const edu_bg_index = user.educational_backgrounds.findIndex(
        (bg) => bg._id?.toString() === backgroundId,
      );

      if (edu_bg_index === -1) {
        throw new NotFoundException(
          `Educational background with ID ${backgroundId} not found`,
        );
      }

      // Schema validation will handle marks_gpa validation automatically

      // Build dynamic update query for nested document fields
      const updateQuery: any = {};

      Object.keys(payload).forEach((key) => {
        if (key === 'marks_gpa' && payload.marks_gpa) {
          // Update each key in the marks_gpa object separately ONLY IF the matching key is present in the payload
          Object.keys(payload.marks_gpa).forEach((gpaKey) => {
            updateQuery[
              `educational_backgrounds.${edu_bg_index}.marks_gpa.${gpaKey}`
            ] = payload.marks_gpa[gpaKey];
          });
        } else {
          updateQuery[`educational_backgrounds.${edu_bg_index}.${key}`] =
            payload[key];
        }
      });

      const result = await this.userModel.updateOne(
        { _id: userId },
        { $set: updateQuery },
        { runValidators: true },
      );

      if (result.modifiedCount === 0) {
        throw new NotFoundException('Failed to update educational background');
      }

      return result;
    } catch (error) {
      console.error('Error updating educational background:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async removeEducationalBackground(
    userId: string,
    backgroundId: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.educational_backgrounds) {
      throw new NotFoundException('No educational backgrounds found');
    }

    const initialLength = user.educational_backgrounds.length;
    user.educational_backgrounds = user.educational_backgrounds.filter(
      (bg) => bg._id?.toString() !== backgroundId,
    );

    if (user.educational_backgrounds.length === initialLength) {
      throw new NotFoundException(
        `Educational background with ID ${backgroundId} not found`,
      );
    }

    return user.save();
  }

  async updateNationalIdCard(
    userId: string,
    payload: UpdateNationalIdCardDto,
  ): Promise<User> {
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

  async findByResetToken(token: string, date: Date): Promise<UserDocument> {
    return this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpiration: { $gt: date },
      })
      .exec();
  }

  async findByVerifyToken(token: string): Promise<UserDocument> {
    return this.userModel.findOne({ verifyToken: token }).exec();
  }
}
