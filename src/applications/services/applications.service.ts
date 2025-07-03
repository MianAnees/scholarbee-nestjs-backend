import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder, UpdateQuery } from 'mongoose';
import {
  ApplicantSnapshot,
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
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { NotificationService } from 'src/notification/services/notfication.service';
import { LegalDocumentStatus } from 'src/legal-documents/schemas/legal-document.schema';

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
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Creates an applicant snapshot by fetching user from database
   * @param applicantId The applicant user ID
   * @returns The applicant snapshot object
   */
  private async createApplicantSnapshot(applicantId: string) {
    // Fetch the user data as a plain object for efficiency
    const user = await this.userModel.findById(applicantId).lean().exec();
    if (!user) {
      throw new NotFoundException('Applicant user not found');
    }

    // Get the sub-schema for ApplicantSnapshot from the main Application model
    const applicantSnapshotSchema =
      this.applicationModel.schema.path('applicant_snapshot').schema;

    // Get required paths from the schema definition
    const requiredPaths = applicantSnapshotSchema.requiredPaths();

    // Check for missing required fields on the user object
    const missingFields = requiredPaths.filter(
      (path) => user[path] === null || user[path] === undefined,
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Your profile is incomplete. Please update the following details before submitting an application: ${missingFields.join(
          ', ',
        )}`,
      );
    }

    // Get all paths defined in the snapshot schema to build a clean object
    const allSnapshotPaths = Object.keys(applicantSnapshotSchema.paths);
    const snapshot = {};

    // Construct a clean snapshot object containing only the fields defined in the schema
    allSnapshotPaths.forEach((path) => {
      if (user[path] !== undefined) {
        snapshot[path] = user[path];
      }
    });

    return snapshot;
  }

  /**
   * Validates that the applicant has accepted all required legal documents and returns the filtered list
   * of accepted documents that match the requirements.
   *
   * @param acceptedLegalDocuments Array of accepted legal document IDs
   * @returns Filtered array of accepted legal document IDs that match requirements
   * @throws BadRequestException if any required document is not accepted
   */
  private async validateAndFilterAcceptedLegalDocuments(
    acceptedLegalDocuments: Types.ObjectId[] = [],
  ): Promise<Types.ObjectId[]> {
    // Get required documents
    const requiredDocuments = await this.getApplicationLegalDocuments();

    // If no required documents, then return empty array (no documents required)
    if (requiredDocuments.length === 0) {
      return [];
    }

    // If no accepted legal documents, then throw error (no documents accepted)
    if (!acceptedLegalDocuments?.length) {
      throw new BadRequestException('Legal documents acceptance is required');
    }

    const requiredLegalDocumentIds = requiredDocuments.map((doc) =>
      doc._id.toString(),
    );

    // Create Sets for O(1) lookups
    const requiredDocSet = new Set(requiredLegalDocumentIds);
    const acceptedDocSet = new Set(
      acceptedLegalDocuments.map((doc) => doc.toString()),
    );

    // Find any missing required documents
    const isMissingReqDocs = requiredLegalDocumentIds.some((reqDocId) => {
      const isAccepted = acceptedDocSet.has(reqDocId);
      return !isAccepted;
    });

    // !BUG: Wrong error message. Even though the correct document is passed, it throws an error.
    if (isMissingReqDocs) {
      throw new BadRequestException(
        `Missing acceptance for required legal documents`,
      );
    }

    // Filter accepted documents to only include required ones (Ignore the accepted documents that are not required)
    return acceptedLegalDocuments.filter((acceptedDocId) =>
      requiredDocSet.has(acceptedDocId.toString()),
    );
  }

  /**
   * @deprecated Use createWithUserSnapshot instead
   * @param createApplicationDto - The application data to create
   * @returns The created application
   */
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
    user: AuthenticatedRequest['user'],
  ): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    // Check if application is already submitted (Pending status means submitted)
    const existingApplication = await this.applicationModel.findById(id).exec();
    if (!existingApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Prevent updates to submitted applications (status other than DRAFT)
    if (existingApplication.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update application after submission.`,
      );
    }

    const { accepted_legal_documents, ...restUpdateApplicationDto } =
      updateApplicationDto;
    let updatedDocument: UpdateQuery<ApplicationDocument> =
      restUpdateApplicationDto;

    if (updateApplicationDto.is_submitted) {
      // Validate and filter the accepted_legal_documents
      const validatedAndFilteredAcceptedLegalDocuments =
        await this.validateAndFilterAcceptedLegalDocuments(
          updateApplicationDto.accepted_legal_documents,
        );

      // Create applicant snapshot on submission using authenticated user ID
      const applicant_snapshot = await this.createApplicantSnapshot(user._id);

      updatedDocument.status = ApplicationStatus.PENDING; // "Pending" status is set when application is submitted
      updatedDocument.applicant_snapshot = applicant_snapshot;
      updatedDocument.accepted_legal_documents =
        validatedAndFilteredAcceptedLegalDocuments;
    }

    const updatedApplication = await this.applicationModel
      .findByIdAndUpdate(id, updatedDocument, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Trigger notification for application submission
    if (updateApplicationDto.is_submitted) {
      try {
        await this.notificationService.createSpecificCampusesNotification({
          title: 'New Application Submitted',
          message: `A new application has been submitted for ${updatedApplication.program}. Please review and take necessary action.`,
          campusIds: [updatedApplication.campus_id],
        });
      } catch (error) {
        console.error('Error sending submission notification:', error);
        // Don't fail the application update if notification fails
      }
    }

    // Emit the update via WebSocket
    this.applicationsGateway.emitApplicationUpdate(updatedApplication);

    return updatedApplication;
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    const updatedApplication = await this.applicationModel
      .findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Trigger notification for application approval
    if (status === ApplicationStatus.APPROVED) {
      try {
        await this.notificationService.createSpecificUsersNotification({
          title: 'Application Approved!',
          message: `Congratulations! Your application for ${updatedApplication.program} has been approved. Check your application status for next steps.`,
          userIds: [updatedApplication.applicant],
        });
      } catch (error) {
        console.error('Error sending approval notification:', error);
        // Don't fail the status update if notification fails
      }
    }

    // Trigger notification for application rejection
    if (status === ApplicationStatus.REJECTED) {
      try {
        await this.notificationService.createSpecificUsersNotification({
          title: 'Application Status Update',
          message: `Your application for ${updatedApplication.program} has been reviewed. Please check your application status for more details.`,
          userIds: [updatedApplication.applicant],
        });
      } catch (error) {
        console.error('Error sending rejection notification:', error);
        // Don't fail the status update if notification fails
      }
    }

    // Trigger notification for application under review
    if (status === ApplicationStatus.UNDER_REVIEW) {
      try {
        await this.notificationService.createSpecificUsersNotification({
          title: 'Application Under Review',
          message: `Your application for ${updatedApplication.program} is now under review. We'll notify you once the review is complete.`,
          userIds: [updatedApplication.applicant],
        });
      } catch (error) {
        console.error('Error sending under review notification:', error);
        // Don't fail the status update if notification fails
      }
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
    user: AuthenticatedRequest['user'],
    createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationDocument> {
    try {
      // Check if user has already applied for this admission program
      const existingApplication = await this.applicationModel
        .findOne({
          applicant: user.sub,
          admission_program_id: createApplicationDto.admission_program_id,
        })
        .exec();

      if (existingApplication) {
        throw new BadRequestException(
          'Already applied for this admission program.',
        );
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create the application without snapshot (snapshot will be created on submission)
      const application = new this.applicationModel({
        ...createApplicationDto,
        applicant: user._id,
        student_id: user._id, // Map applicant to student_id
        program_id: createApplicationDto.program, // Map program to program_id
        admission_id: createApplicationDto.admission, // Map admission to admission_id
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

  /**
   * Get application associated legal documents
   * This method checks the legal document requirements for application action
   * and returns the actual legal documents required for the application
   */
  async getApplicationLegalDocuments() {
    // Get the requirements for student program application action type
    const legalDocumentRequirementDoc =
      await this.legalDocumentRequirementsService.findByActionType(
        LegalActionType.STUDENT_PROGRAM_APPLICATION,
      );

    if (!legalDocumentRequirementDoc) return [];

    const allRequiredDocumentTypes =
      legalDocumentRequirementDoc.required_document_types;

    // Find all the legal documents against the required document types that are active
    const associatedLegalDocuments = await this.legalDocumentsService.findAll({
      document_types: allRequiredDocumentTypes,
      status: LegalDocumentStatus.ACTIVE,
    });

    if (!associatedLegalDocuments.length) {
      return [];
    }

    return associatedLegalDocuments;
  }

  // Make generic to get the analytics for all users as well as for a specific user
  async getApplicationsAnalytics(user: AuthenticatedRequest['user']) {
    // Get total count of applications
    const totalApplications = await this.applicationModel.countDocuments({
      applicant: user._id,
    });

    // Get breakdown by status using aggregation
    const statusBreakdown = await this.applicationModel.aggregate([
      {
        $match: {
          applicant: user._id,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create breakdown object with all possible statuses
    const breakdown = {
      [ApplicationStatus.DRAFT]: 0,
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.APPROVED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.UNDER_REVIEW]: 0,
    };

    // Fill in the actual counts
    statusBreakdown.forEach((item) => {
      if (item._id && breakdown.hasOwnProperty(item._id)) {
        breakdown[item._id] = item.count;
      }
    });

    return {
      totalApplications,
      breakdown,
    };
  }
}
