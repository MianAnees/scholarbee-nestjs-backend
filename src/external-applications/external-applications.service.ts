import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { stringToObjectId } from 'src/utils/db.utils';
import { CreateExternalApplicationDto } from './dto/create-external-application.dto';
import { QueryExternalApplicationDto } from './dto/query-external-application.dto';
import {
  ExternalApplication,
  ExternalApplicationDocument,
} from './schemas/external-application.schema';
import {
  AdmissionProgram,
  AdmissionProgramDocument,
} from '../admission-programs/schemas/admission-program.schema';

interface FindAllOptions {
  page: number;
  limit: number;
  status?: string;
  campusId?: string;
  program?: string;
}

@Injectable()
export class ExternalApplicationsService {
  constructor(
    @InjectModel(ExternalApplication.name)
    private externalApplicationModel: Model<ExternalApplicationDocument>,
    @InjectModel(AdmissionProgram.name)
    private admissionProgramModel: Model<AdmissionProgramDocument>,
    @InjectConnection()
    private connection: Connection,
  ) {}
  /**
   * TODO: Check if this method can be integrated with the user service/ user model to make it reusable
   * Creates an applicant snapshot from user data
   * @param user The user document to create snapshot from
   * @returns The applicant snapshot object
   */
  private createApplicantSnapshot(user: AuthenticatedRequest['user']) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      date_of_birth,
      father_name,
      father_profession,
      father_status,
      father_income,
      mother_name,
      mother_profession,
      mother_status,
      mother_income,
      religion,
      special_person,
      gender,
      nationality,
      provinceOfDomicile,
      districtOfDomicile,
      stateOrProvince,
      city,
      postalCode,
      streetAddress,
      profile_image_url,
      user_type,
      educational_backgrounds,
      national_id_card,
    } = user;

    return {
      first_name: first_name || null,
      last_name: last_name || null,
      email: email || null,
      phone_number: phone_number || null,
      date_of_birth: date_of_birth || null,
      father_name: father_name || null,
      father_profession: father_profession || null,
      father_status: father_status || null,
      father_income: father_income || null,
      mother_name: mother_name || null,
      mother_profession: mother_profession || null,
      mother_status: mother_status || null,
      mother_income: mother_income || null,
      religion: religion || null,
      special_person: special_person || null,
      gender: gender || null,
      nationality: nationality || null,
      provinceOfDomicile: provinceOfDomicile || null,
      districtOfDomicile: districtOfDomicile || null,
      stateOrProvince: stateOrProvince || null,
      city: city || null,
      postalCode: postalCode || null,
      streetAddress: streetAddress || null,
      profile_image_url: profile_image_url || null,
      user_type: user_type || null,
      educational_backgrounds:
        educational_backgrounds?.map((edu) => ({
          id: edu.id,
          education_level: edu.education_level || null,
          field_of_study: edu.field_of_study || null,
          school_college_university: edu.school_college_university || null,
          marks_gpa: {
            total_marks_gpa: edu.marks_gpa?.total_marks_gpa || null,
            obtained_marks_gpa: edu.marks_gpa?.obtained_marks_gpa || null,
          },
          year_of_passing: edu.year_of_passing || null,
          board: edu.board || null,
          transcript: edu.transcript || null,
        })) || [],
      national_id_card: {
        front_side: national_id_card?.front_side || null,
        back_side: national_id_card?.back_side || null,
      },
    };
  }

  async create(
    user: AuthenticatedRequest['user'],
    createExternalApplicationDto: CreateExternalApplicationDto,
  ) {
    const { program, admission, admission_program, campus } =
      createExternalApplicationDto;

    const applicant_snapshot = this.createApplicantSnapshot(user);

    const applicationData: ExternalApplication = {
      applicant: stringToObjectId(user._id),
      applicant_snapshot,
      program,
      admission,
      admission_program,
      campus,
    };

    // Start a transaction session
    const session = await this.connection.startSession();

    try {
      // Start the transaction
      await session.withTransaction(async () => {
        // Create the external application within the transaction
        const externalApplication = new this.externalApplicationModel(
          applicationData,
        );
        const savedApplication = await externalApplication.save({ session });

        // Add the student to the admission program's redirect_students array
        await this.admissionProgramModel.findByIdAndUpdate(
          admission_program,
          {
            $addToSet: { redirect_students: stringToObjectId(user._id) },
          },
          { new: true, session },
        );

        return savedApplication;
      });

      // If we reach here, the transaction was successful
      // Fetch the saved application to return it
      const savedApplication = await this.externalApplicationModel
        .findOne({ applicant: stringToObjectId(user._id) })
        .sort({ createdAt: -1 });

      return savedApplication;
    } catch (error) {
      // Transaction will be automatically rolled back
      throw error;
    } finally {
      // End the session
      await session.endSession();
    }
  }

  async findAll(
    user: AuthenticatedRequest['user'],
    queryDto: QueryExternalApplicationDto,
  ) {
    const { page, limit } = queryDto;
    const skip = (page - 1) * limit;

    const applications = await this.externalApplicationModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.externalApplicationModel.countDocuments();

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const application = await this.externalApplicationModel
      .findOne({
        _id: id,
        student_id: userId,
      })
      .populate('program_id', 'name code description')
      .populate('admission_id', 'title year description')
      .exec();

    if (!application) {
      throw new NotFoundException('External application not found');
    }

    return application;
  }
}
