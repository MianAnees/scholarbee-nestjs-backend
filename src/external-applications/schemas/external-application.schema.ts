import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicantSnapshot } from 'src/applications/schemas/application.schema';

export type ExternalApplicationDocument = ExternalApplication & Document;

@Schema({ timestamps: true, collection: 'external_applications' })
export class ExternalApplication {
  @Prop({ type: Types.ObjectId, ref: 'Program', required: true })
  program: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Admission',
    required: true,
  })
  admission: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  applicant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AdmissionProgram', required: true })
  admission_program: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campus', required: true })
  campus: Types.ObjectId;

  @Prop({ type: Object, required: true })
  applicant_snapshot: ApplicantSnapshot;
}

export const ExternalApplicationSchema =
  SchemaFactory.createForClass(ExternalApplication);
