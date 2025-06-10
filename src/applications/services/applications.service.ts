import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from '../schemas/application.schema';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
import { QueryApplicationDto } from '../dto/query-application.dto';
import { ApplicationsGateway } from '../gateways/applications.gateway';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { LegalDocumentRequirementsService } from '../../legal-document-requirements/legal-document-requirements.service';
import { LegalDocumentsService } from '../../legal-documents/legal-documents.service';
import { LegalActionType } from '../../legal-document-requirements/schemas/legal-document-requirement.schema';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly applicationsGateway: ApplicationsGateway,
    private readonly legalDocumentRequirementsService: LegalDocumentRequirementsService,
    private readonly legalDocumentsService: LegalDocumentsService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationDocument> {
    try {
      const createdApplication = new this.applicationModel(
        createApplicationDto,
      );
      const savedApplication = await createdApplication.save();

      // Emit the update via WebSocket
      this.applicationsGateway.emitApplicationUpdate(savedApplication);

      return savedApplication;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QueryApplicationDto,
  ): Promise<{ data: ApplicationDocument[]; meta: any }> {
    const {
      student_id,
      program_id,
      admission_id,
      applicant_id,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate = true,
    } = queryDto;

    const filter: any = {};

    if (student_id) {
      filter.student_id = student_id;
    }

    if (program_id) {
      filter.program_id = program_id;
    }

    if (admission_id) {
      filter.admission_id = admission_id;
    }

    if (applicant_id) {
      filter.applicant = applicant_id;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let query = this.applicationModel.find(filter);

    if (populate) {
      query = query
        .populate('student_id')
        .populate('program_id')
        .populate('admission_id')
        .populate('campus_id')
        .populate('program')
        .populate('admission_program_id')
        .populate({
          path: 'departments.department',
          model: 'AcademicDepartment',
        })
        .populate({
          path: 'departments.preferences.program',
          model: 'Program',
        });
    }

    const [applications, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    populate: boolean = true,
  ): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    let query = this.applicationModel.findById(id);

    if (populate) {
      query = query
        .populate('student_id')
        .populate('program_id')
        .populate('admission_id')
        .populate('campus_id')
        .populate('program')
        .populate('admission_program_id')
        .populate({
          path: 'departments.department',
          model: 'AcademicDepartment',
        })
        .populate({
          path: 'departments.preferences.program',
          model: 'Program',
        });
    }

    const application = await query.exec();

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async findByApplicant(
    applicantId: string,
    queryDto: QueryApplicationDto,
  ): Promise<{ data: ApplicationDocument[]; meta: any }> {
    return this.findAll({
      ...queryDto,
      applicant_id: applicantId,
    });
  }

  async update(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    if (updateApplicationDto.status === ApplicationStatus.PENDING) {
      // Check if the applicant has accepted the legal documents
      const requiredLegalDocumentIds =
        await this.getLegalDocumentIdsForApplication();

      const stringifiedAcceptedLegalDocumentIds =
        updateApplicationDto.accepted_legal_documents.map((id) =>
          id.toString(),
        );

      // check is same length
      if (
        updateApplicationDto.accepted_legal_documents.length !==
        requiredLegalDocumentIds.length
      ) {
        throw new BadRequestException('Legal documents are required');
      }

      // check if all the required legal documents are accepted
      for (const requiredLegalDocumentId of requiredLegalDocumentIds) {
        const stringifiedRequiredLegalDocumentId =
          requiredLegalDocumentId.toString();

        // check if each of the required legal document is available in the accepted legal documents
        if (
          !stringifiedAcceptedLegalDocumentIds.includes(
            stringifiedRequiredLegalDocumentId,
          )
        ) {
          throw new BadRequestException(
            `Legal document ${stringifiedRequiredLegalDocumentId} is required`,
          );
        }
      }
    }

    const updatedApplication = await this.applicationModel
      .findByIdAndUpdate(id, updateApplicationDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Emit the update via WebSocket
    this.applicationsGateway.emitApplicationUpdate(updatedApplication);

    return updatedApplication;
  }

  async updateStatus(id: string, status: string): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    if (!['Pending', 'Approved', 'Rejected', 'Under Review'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const updatedApplication = await this.applicationModel
      .findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Emit the update via WebSocket
    this.applicationsGateway.emitApplicationUpdate(updatedApplication);

    return updatedApplication;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applicationModel.findById(id).exec();

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    await this.applicationModel.findByIdAndDelete(id).exec();

    // Emit the deletion via WebSocket
    this.applicationsGateway.emitApplicationUpdate({
      _id: id,
      deleted: true,
      applicant: application.applicant,
      campus_id: application.campus_id,
      program: application.program,
    });

    return { deleted: true };
  }

  async getApplicationStatistics(): Promise<any> {
    const stats = await this.applicationModel
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const totalApplications = await this.applicationModel.countDocuments();

    const result = {
      total: totalApplications,
      byStatus: {},
    };

    stats.forEach((stat) => {
      result.byStatus[stat._id] = stat.count;
    });

    return result;
  }

  async createWithUserSnapshot(
    createApplicationDto: CreateApplicationDto,
    userId: string,
  ): Promise<ApplicationDocument> {
    try {
      // TODO: Check the payload for the associated legal documents required for application

      // Check if user has already applied for this admission program
      const existingApplication = await this.applicationModel
        .findOne({
          applicant: userId,
          admission_program_id: createApplicationDto.admission_program_id,
        })
        .exec();

      if (existingApplication) {
        throw new BadRequestException(
          'Already applied for this admission program.',
        );
      }

      // Fetch the complete user data to create the snapshot
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create applicant snapshot from user data
      const applicant_snapshot = {
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        email: user.email || null,
        phone_number: user.phone_number || null,
        date_of_birth: user.date_of_birth || null,
        father_name: user.father_name || null,
        father_profession: user.father_profession || null,
        father_status: user.father_status || null,
        father_income: user.father_income || null,
        mother_name: user.mother_name || null,
        mother_profession: user.mother_profession || null,
        mother_status: user.mother_status || null,
        mother_income: user.mother_income || null,
        religion: user.religion || null,
        special_person: user.special_person || null,
        gender: user.gender || null,
        nationality: user.nationality || null,
        provinceOfDomicile: user.provinceOfDomicile || null,
        districtOfDomicile: user.districtOfDomicile || null,
        stateOrProvince: user.stateOrProvince || null,
        city: user.city || null,
        postalCode: user.postalCode || null,
        streetAddress: user.streetAddress || null,
        profile_image_url: user.profile_image_url || null,
        user_type: user.user_type || null,
        educational_backgrounds:
          user.educational_backgrounds?.map((edu) => ({
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
          front_side: user.national_id_card?.front_side || null,
          back_side: user.national_id_card?.back_side || null,
        },
      };

      // Create the application with the snapshot and map fields correctly
      const application = new this.applicationModel({
        ...createApplicationDto,
        applicant: userId,
        student_id: userId, // Map applicant to student_id
        program_id: createApplicationDto.program, // Map program to program_id
        admission_id: createApplicationDto.admission, // Map admission to admission_id
        applicant_snapshot,
        submission_date: new Date(),
        status: ApplicationStatus.DRAFT,
      });

      const savedApplication = await application.save();

      // Emit the update via WebSocket if needed
      this.applicationsGateway.emitApplicationUpdate(savedApplication);

      return savedApplication;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error creating application:', error);
      throw new BadRequestException(
        error.message || 'Error processing application',
      );
    }
  }

  private async getLegalDocumentIdsForApplication() {
    // Get the requirements for student program application action type
    const requirements = await this.legalDocumentRequirementsService.findAll({
      applicable_on: LegalActionType.STUDENT_PROGRAM_APPLICATION,
    });

    if (!requirements.length) {
      return [];
    }

    return requirements.flatMap((req) => req.required_documents);
  }

  /**
   * Get application associated legal documents
   * This method checks the legal document requirements for application action
   * and returns the actual legal documents required for the application
   */
  async getApplicationLegalDocuments() {
    // Extract all required document IDs from the requirements
    const associatedLogalDocumentIds =
      await this.getLegalDocumentIdsForApplication();

    if (!associatedLogalDocumentIds.length) {
      return [];
    }

    // Fetch the actual legal documents using the extracted document IDs
    const associatedLegalDocuments = await this.legalDocumentsService.findAll({
      document_ids: associatedLogalDocumentIds,
    });

    return associatedLegalDocuments;
  }
}
