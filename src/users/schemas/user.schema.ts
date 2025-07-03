import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { Document } from 'mongoose';
import { LivingStatusEnum } from 'src/common/constants/shared.constants';
import { IsValidObjectId } from 'src/common/validators/object-id.validator';

// typescript namespace with all the user type enums
export namespace UserNS {
  export enum UserType {
    Student = 'Student',
    Admin = 'Admin',
    Campus_Admin = 'Admin',
  }
  // Educational background interfaces
  export interface IMarksGPA {
    total_marks_gpa: string;
    obtained_marks_gpa: string;
  }

  export interface IEducationalBackground {
    _id: Types.ObjectId;
    board?: string; // Optional
    education_level: string; // Required
    field_of_study?: string; // Optional
    marks_gpa: IMarksGPA; // Required
    school_college_university?: string; // Optional
    transcript?: string; // Optional
    year_of_passing?: string; // Optional
  }

  export interface INationalIdCard {
    front_side?: string;
    back_side?: string;
  }
}

@Schema({
  timestamps: false,
  _id: false,
})
export class MarksGPA implements UserNS.IMarksGPA {
  @Prop({ required: true })
  total_marks_gpa: string;

  @Prop({ required: true })
  obtained_marks_gpa: string;
}

// Schema Class for educational background
@Schema({
  _id: true,
  timestamps: false,
})
export class EducationalBackground implements UserNS.IEducationalBackground {
  @Prop({ required: true, type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true })
  education_level: string;

  @Prop({ required: false })
  school_college_university?: string;

  @Prop({ type: MarksGPA, required: true })
  marks_gpa: MarksGPA;

  @Prop({ required: false })
  field_of_study?: string;

  @Prop({ required: false })
  year_of_passing?: string;

  @Prop({ required: false })
  board?: string;

  @Prop({ required: false })
  transcript?: string;
}

// Schema Class for national id card
@Schema({
  timestamps: false,
})
export class NationalIdCard implements UserNS.INationalIdCard {
  @Prop({ required: false })
  front_side?: string;

  @Prop({ required: false })
  back_side?: string;
}

// Add the comparePassword method to the interface
export interface UserDocument extends User, Document<Types.ObjectId> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop()
  date_of_birth?: Date;

  @Prop()
  father_name?: string;

  @Prop()
  father_profession?: string;

  @Prop({
    type: String,
    enum: LivingStatusEnum,
  })
  father_status?: LivingStatusEnum;

  @Prop()
  father_income?: string;

  @Prop()
  mother_name?: string;

  @Prop()
  mother_profession?: string;

  @Prop({
    type: String,
    enum: LivingStatusEnum,
  })
  mother_status?: LivingStatusEnum;

  @Prop()
  mother_income?: string;

  @Prop()
  religion?: string;

  @Prop({ enum: ['yes', 'no'] })
  special_person?: string;

  @Prop({ enum: ['Male', 'Female', 'Other'] })
  gender?: string;

  @Prop()
  nationality?: string;

  @Prop({ required: true, unique: true, immutable: true })
  email: string;

  @Prop()
  phone_number?: string;

  // 0 means only signup is completed
  // 1 means only profile is completed
  // 2 means only academic is completed
  // 3 means only financial is completed
  // 4 means only document is completed
  // 5 means all steps are completed
  @Prop({ default: 0 })
  current_stage?: number;

  @Prop()
  fatherEmailAddress?: string;

  @Prop()
  fatherPhoneNumber?: string;

  @Prop({ enum: ['khyber_pakhtunkhwa', 'punjab', 'sindh', 'balochistan'] })
  provinceOfDomicile?: string;

  @Prop()
  districtOfDomicile?: string;

  @Prop()
  stateOrProvince?: string;

  @Prop()
  city?: string;

  @Prop()
  postalCode?: string;

  @Prop()
  streetAddress?: string;

  @Prop()
  address_id?: Types.ObjectId;

  @Prop({ required: true, enum: UserNS.UserType })
  user_type: UserNS.UserType;

  @Prop()
  registration_no?: string;

  @Prop()
  university_id?: string;

  @Prop()
  campus_id?: string;

  @Prop()
  user_profile_id?: string;

  @Prop()
  profile_image_url?: string;

  @Prop({ type: [EducationalBackground], default: [] })
  educational_backgrounds: EducationalBackground[];

  @Prop({ type: NationalIdCard })
  national_id_card: NationalIdCard;

  @Prop({ default: () => new Date() })
  created_at: Date;

  @Prop({ default: '' })
  verifyToken: string;

  @Prop({ default: false })
  _verified: boolean;

  @Prop({ default: false })
  isProfileCompleted: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  salt: string;

  @Prop()
  hash: string;

  // refresh token hash
  @Prop({ default: null })
  refreshTokenHash: string;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordExpiration?: Date;

  @Prop()
  password: string;

  isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.hash) {
      return false;
    }

    try {
      // Use direct compare instead of re-hashing with salt
      return await bcrypt.compare(candidatePassword, this.hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add pre-save hooks for password hashing
UserSchema.pre('save', async function (next) {
  const user = this;
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    user.salt = salt;

    // Hash the password using our new salt
    const hash = await bcrypt.hash(user.password, salt);
    user.hash = hash;

    // Remove the plain text password
    user.password = undefined;

    next();
  } catch (error) {
    next(error);
  }
});

// Add method to check password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.hash) {
    return false;
  }

  try {
    // Use direct compare instead of re-hashing with salt
    return await bcrypt.compare(candidatePassword, this.hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Add methods to the schema
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};
