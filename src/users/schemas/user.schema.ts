import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { FatherLivingStatusEnum } from 'src/student-scholarships/schemas/student-scholarship.schema';


// typescript namespace with all the user type enums
export namespace UserNS {
    export enum UserType {
      Student = 'Student',
      Admin = 'Admin',
      Campus_Admin = 'Admin', // REVIEW: This or the above should be changed to create a distinction between the admin and the campus admin
    }
}



// Add the comparePassword method to the interface
export interface UserDocument extends User, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({
    timestamps: true,
    collection: 'users'
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
        enum: FatherLivingStatusEnum
    })
    father_status?: FatherLivingStatusEnum;

    @Prop()
    father_income?: string;

    @Prop()
    mother_name?: string;

    @Prop()
    mother_profession?: string;

    @Prop({ enum: ['alive', 'deceased'] })
    mother_status?: string;

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

    @Prop({ required: true, unique: true })
    email: string;

    @Prop()
    phone_number?: string;

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
    address_id?: string;

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

    @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
    educational_backgrounds: any[];

    @Prop({ type: MongooseSchema.Types.Mixed })
    national_id_card: any;

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
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
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