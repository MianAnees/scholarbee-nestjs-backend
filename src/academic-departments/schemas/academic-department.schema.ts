import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Campus } from '../../campuses/schemas/campus.schema';

export type AcademicDepartmentDocument = AcademicDepartment & Document;

@Schema({ timestamps: true })
export class AcademicDepartment {
    @Prop({ required: true })
    name: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campus' })
    campus_id: MongooseSchema.Types.ObjectId | string;

    @Prop()
    contact_phone: string;

    @Prop()
    contact_email: string;

    @Prop()
    head_of_department: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    createdBy: MongooseSchema.Types.ObjectId | string;
}

export const AcademicDepartmentSchema = SchemaFactory.createForClass(AcademicDepartment); 