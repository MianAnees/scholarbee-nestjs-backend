import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import {
  Scholarship,
  ScholarshipDocument,
} from 'src/scholarships/schemas/scholarship.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import {
  CreateStudentScholarshipDto,
  RequiredDocumentDto,
} from '../dto/create-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';
import {
  AddRequiredDocumentDto,
  RemoveRequiredDocumentDto,
  UpdateStudentScholarshipApprovalStatusDto,
  UpdateStudentScholarshipDto,
} from '../dto/update-student-scholarship.dto';
import {
  IStudentScholarship,
  ScholarshipApprovalStatusEnum,
  StudentScholarship,
  StudentScholarshipDocument,
} from '../schemas/student-scholarship.schema';
import { LivingStatusEnum } from 'src/common/constants/shared.constants';

@Injectable()
export class StudentScholarshipsService {
  private readonly logger = new Logger(StudentScholarshipsService.name);

  constructor(
    @InjectModel(StudentScholarship.name)
    private studentScholarshipModel: Model<StudentScholarshipDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Scholarship.name)
    private scholarshipModel: Model<ScholarshipDocument>,
  ) {}

  async createUserSnapshot(
    userId: string,
    apiPayloadSnapshotData: Pick<
      IStudentScholarship['student_snapshot'],
      'last_degree' | 'monthly_household_income'
    >,
  ): Promise<IStudentScholarship['student_snapshot']> {
    const userProfile = await this.userModel.findById<User>(userId).exec();

    if (!userProfile) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!userProfile.father_name || !userProfile.provinceOfDomicile) {
      throw new BadRequestException(
        'Incomplete data in profile. Please complete your profile to continue.',
      );
    }

    const {
      first_name,
      last_name,
      father_name,
      father_status,
      provinceOfDomicile,
      districtOfDomicile,
    } = userProfile;

    const { monthly_household_income, last_degree } = apiPayloadSnapshotData;

    // Create a partial snapshot with data from the user document
    const userSnapshot: IStudentScholarship['student_snapshot'] = {
      name: `${first_name} ${last_name}`,
      father_name,
      father_status,
      provinceOfDomicile,
      districtOfDomicile,
      monthly_household_income,
      last_degree,
    };

    // Return the partial snapshot - client will need to provide:
    // - monthly_household_income
    // - last_degree
    return userSnapshot;
  }

  /**
   * This service should check if the incoming required documents (if available) match the document-type of the scholarship against which the application is being made.
   * If the document-type is not found in the scholarship, an error should be thrown.
   * Primary Scenarios:
   * - The received documents should not be more than the specified documents
   * - The received documents should only be of the types specified in the scholarship
   * - No duplicate documents should be submitted
   * Conditional Scenarios:
   * - If the matchCount is true, the number of received documents should be equal to the number of specified documents.
   * - If the matchCount is false, the number of received documents should be less than or equal to the number of specified documents.
   */
  async validateRequiredDocuments(
    specifiedRequiredDocuments: Scholarship['required_documents'],
    receivedDocuments: Required<IStudentScholarship['required_documents']>,
    shouldMatchCount: boolean,
  ) {
    // No documents submitted
    if (!receivedDocuments) {
      this.logger.log('No documents submitted; skipping validation');
      return;
    }

    const specifiedDocumentTypes = specifiedRequiredDocuments.map(
      (doc) => doc.document_name,
    );

    const receivedDocumentTypes =
      receivedDocuments?.map((doc) => doc.document_name) || [];

    // Quick check: if lengths are equal, there are no duplicates
    const uniqueDocumentTypes = new Set(receivedDocumentTypes);
    if (uniqueDocumentTypes.size !== receivedDocumentTypes.length) {
      // If we get here, we know there are duplicates, so let's find them
      const documentCounts = new Map<string, number>();
      for (const docType of receivedDocumentTypes) {
        documentCounts.set(docType, (documentCounts.get(docType) || 0) + 1);
      }

      // Find document types that appear more than once
      const duplicateDocuments = Array.from(documentCounts.entries())
        .filter(([_, count]) => count > 1) // Keep only entries with count > 1
        .map(([docType]) => docType); // Extract just the document type names

      throw new BadRequestException(
        `Duplicate document(s) submitted: ${duplicateDocuments.join(', ')}`,
      );
    }

    if (shouldMatchCount) {
      // if the matchCount is true, receivedDocument count should be equal to specifiedDocument count
      if (receivedDocumentTypes.length !== specifiedDocumentTypes.length) {
        throw new BadRequestException(
          `Scholarship application requires exactly ${specifiedDocumentTypes.length} documents: ${specifiedDocumentTypes.join(', ')}`,
        );
      }
    }
    // if the matchCount is false, only ensure that receivedDoc Count is not more than specifiedDoc Count
    else if (receivedDocumentTypes.length > specifiedDocumentTypes.length) {
      throw new BadRequestException(
        `Scholarship application requires at most ${specifiedDocumentTypes.length} documents: ${specifiedDocumentTypes.join(', ')}`,
      );
    }

    // Check if the received documents are of the required types
    for (const documentType of receivedDocumentTypes) {
      if (!specifiedDocumentTypes.includes(documentType)) {
        throw new BadRequestException(
          `The document type: ${documentType} is not required for this scholarship`,
        );
      }
    }
  }

  /**
   * Create a new student scholarship application against a scholarship on behalf of a student
   * REVIEW: This service should not allow adding/updating required documents.
   */
  async create(
    createStudentScholarshipDto: CreateStudentScholarshipDto,
    userId: string,
  ): Promise<StudentScholarshipDocument> {
    try {
      // Verify the student_id and scholarship_id are valid entries in the database
      const student = await this.userModel
        .findById(createStudentScholarshipDto.student_id)
        .exec();
      const scholarship = await this.scholarshipModel
        .findById(createStudentScholarshipDto.scholarship_id)
        .exec();
      if (!student) {
        throw new NotFoundException(
          `Student with ID ${createStudentScholarshipDto.student_id} not found`,
        );
      }
      if (!scholarship) {
        throw new NotFoundException(
          `Scholarship with ID ${createStudentScholarshipDto.scholarship_id} not found`,
        );
      }

      // Check if the student has already applied for this scholarship
      // REVIEW: Is the user allowed to apply twice?
      // REVIEW: What if the previous application was rejected?
      // REVIEW: Is there a re-apply threshold after which a rejected student can apply?
      const existingApplication = await this.studentScholarshipModel.findOne({
        student_id: createStudentScholarshipDto.student_id,
        scholarship_id: createStudentScholarshipDto.scholarship_id,
      });

      if (existingApplication) {
        throw new ConflictException(
          'You have already applied for this scholarship',
        );
      }

      // Get user snapshot data from the database
      const userSnapshot = await this.createUserSnapshot(
        userId,
        createStudentScholarshipDto.student_snapshot,
      );

      // Validate the required documents
      await this.validateRequiredDocuments(
        scholarship.required_documents,
        createStudentScholarshipDto.required_documents,
        true,
      );

      const newStudentScholarshipApplication: IStudentScholarship = {
        ...createStudentScholarshipDto,
        student_snapshot: userSnapshot,
        createdBy: new Types.ObjectId(userId),
        application_date: new Date(),
        approval_status: ScholarshipApprovalStatusEnum.Applied,
      };

      // Create a new student scholarship application
      const createdApplication = new this.studentScholarshipModel(
        newStudentScholarshipApplication,
      );
      return await createdApplication.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async debugCollection() {
    const pipeline = [
      {
        $group: {
          _id: null,
          studentIds: { $addToSet: '$student_id' },
        },
      },
    ];

    const result = await this.studentScholarshipModel
      .aggregate(pipeline)
      .exec();
    console.log('Unique student_ids in collection:', result[0]?.studentIds);
  }

  async findAll(
    queryDto: QueryStudentScholarshipDto,
  ): Promise<{ data: StudentScholarshipDocument[]; meta: any }> {
    try {
      const {
        search,
        student_id,
        scholarship_id,
        father_status,
        approval_status,
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        populate = true,
      } = queryDto;

      const filter: RootFilterQuery<StudentScholarshipDocument> = {};

      if (student_id) {
        filter.student_id = student_id;
      }

      if (scholarship_id) {
        filter.scholarship_id = scholarship_id;
      }

      if (search) {
        filter.$or = [
          { 'student_snapshot.name': { $regex: search, $options: 'i' } },
          // { 'student_snapshot.father_name': { $regex: search, $options: 'i' } },
          // { personal_statement: { $regex: search, $options: 'i' } }
        ];
      }

      if (father_status) {
        filter['student_snapshot.father_status'] = father_status;
      }

      if (approval_status) {
        filter.approval_status = approval_status;
      }

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      let query = this.studentScholarshipModel.find(filter);

      if (populate) {
        query = query
          .populate({
            path: 'student_id',
            // select: 'first_name last_name email phone_number current_stage user_type educational_backgrounds provinceOfDomicile'
          })
          .populate({
            path: 'scholarship_id',
            // select: 'scholarship_name scholarship_type amount application_deadline status required_documents'
          });
      }

      const [scholarships, total] = await Promise.all([
        query.sort(sort).skip(skip).limit(limit).lean().exec(),
        this.studentScholarshipModel.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: scholarships,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching student scholarships');
    }
  }

  async findOne(id: string): Promise<StudentScholarshipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid scholarship ID');
    }

    const scholarship = await this.studentScholarshipModel
      .findById(id)
      .populate({
        path: 'student_id',
        // select: 'first_name last_name email phone_number current_stage user_type educational_backgrounds provinceOfDomicile'
      })
      .populate({
        path: 'scholarship_id',
        // select: 'scholarship_name scholarship_type amount application_deadline status required_documents'
      })
      .exec();

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return scholarship;
  }

  /**
   * Update a student scholarship application detail including the approval status.
   * TODO: Should this service be allowed to modify the required documents submitted by the student also?
   * REVIEW: This service should not allow adding/updating required documents.
   */
  async update(
    id: string,
    updateStudentScholarshipDto: UpdateStudentScholarshipDto,
  ): Promise<StudentScholarshipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid scholarship ID');
    }

    const previousApplication = await this.studentScholarshipModel
      .findById(id)
      .exec();
    if (!previousApplication)
      throw new NotFoundException(`Application with ID (${id}) not found.`);

    const scholarship = await this.scholarshipModel
      .findById(previousApplication.scholarship_id)
      .exec();
    if (!scholarship)
      throw new NotFoundException(
        `Scholarship with ID (${previousApplication.scholarship_id}) not found.`,
      );

    // Validate the required documents
    await this.validateRequiredDocuments(
      scholarship.required_documents,
      updateStudentScholarshipDto.required_documents,
      true,
    );

    if (!previousApplication) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    // Convert to plain object and merge updates
    const previousApplicationData = previousApplication.toObject();
    const updatedData = {
      ...previousApplicationData,
      ...updateStudentScholarshipDto,
      student_snapshot: {
        ...previousApplicationData.student_snapshot,
        ...updateStudentScholarshipDto.student_snapshot,
        last_degree: {
          ...previousApplicationData.student_snapshot.last_degree,
          ...updateStudentScholarshipDto.student_snapshot?.last_degree,
        },
      },
    };

    // Update the document and return the new version
    const updatedScholarship = await this.studentScholarshipModel
      .findByIdAndUpdate(id, { $set: updatedData }, { new: true })
      .populate({
        path: 'student_id',
        // select: 'first_name last_name email phone_number current_stage user_type educational_backgrounds provinceOfDomicile'
      })
      .populate({
        path: 'scholarship_id',
        // select: 'scholarship_name scholarship_type amount application_deadline status required_documents'
      })
      .exec();

    if (!updatedScholarship) {
      throw new NotFoundException(`Failed to update scholarship with ID ${id}`);
    }

    return updatedScholarship;
  }

  async updateApprovalStatus(
    id: string,
    updateStudentScholarshipApprovalStatusDto: UpdateStudentScholarshipApprovalStatusDto,
  ): Promise<StudentScholarshipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.studentScholarshipModel.findById(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.approval_status =
      updateStudentScholarshipApprovalStatusDto.approval_status;
    return await application.save();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid scholarship ID');
    }

    const result = await this.studentScholarshipModel
      .findByIdAndDelete(id)
      .exec();

    if (!result) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return { deleted: true };
  }

  async getStatistics(): Promise<any> {
    const stats = await Promise.all([
      this.studentScholarshipModel.countDocuments(),
      this.studentScholarshipModel.aggregate([
        {
          $group: {
            _id: '$scholarship_type',
            count: { $sum: 1 },
          },
        },
      ]),
      this.studentScholarshipModel.aggregate([
        {
          $group: {
            _id: '$university_id',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]),
      this.studentScholarshipModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      total: stats[0],
      byType: stats[1].reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      topUniversities: stats[2],
      byStatus: stats[3].reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    };
  }

  async addRequiredDocument(
    studentScholarshipId: Types.ObjectId,
    addRequiredDocumentDto: AddRequiredDocumentDto,
  ): Promise<StudentScholarshipDocument> {
    const existingApplication = await this.studentScholarshipModel
      .findById(studentScholarshipId)
      .exec();

    if (!existingApplication) {
      throw new NotFoundException(
        `Scholarship with ID ${studentScholarshipId} not found`,
      );
    }
    const document = addRequiredDocumentDto.document;

    if (!existingApplication.required_documents) {
      existingApplication.required_documents = [document];
    } else {
      existingApplication.required_documents.push(document);
    }
    return await existingApplication.save();
  }

  async removeRequiredDocument(
    studentScholarshipId: Types.ObjectId,
    removeRequiredDocumentDto: RemoveRequiredDocumentDto,
  ): Promise<StudentScholarshipDocument> {
    const scholarship = await this.studentScholarshipModel
      .findById(studentScholarshipId)
      .exec();

    if (!scholarship) {
      throw new NotFoundException(
        `Scholarship with ID ${studentScholarshipId} not found`,
      );
    }

    const documentName = removeRequiredDocumentDto.document_name;

    if (!scholarship.required_documents) {
      throw new NotFoundException(
        `No existing documents found for deletion against application ID (${studentScholarshipId})`,
      );
    }
    scholarship.required_documents = scholarship.required_documents.filter(
      (doc) => doc.document_name !== documentName,
    );
    return await scholarship.save();
  }

  async getScholarshipApplicationsAnalytics() {
    // Get total count of scholarship applications
    const totalScholarshipApplications =
      await this.studentScholarshipModel.countDocuments();

    // Get breakdown by approval_status using aggregation
    const approvalStatusBreakdown =
      await this.studentScholarshipModel.aggregate([
        {
          $group: {
            _id: '$approval_status',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

    // Create breakdown object with all possible approval statuses
    const breakdown = {
      [ScholarshipApprovalStatusEnum.Applied]: 0,
      [ScholarshipApprovalStatusEnum.Approved]: 0,
      [ScholarshipApprovalStatusEnum.Rejected]: 0,
    };

    // Fill in the actual counts
    approvalStatusBreakdown.forEach((item) => {
      if (item._id && breakdown.hasOwnProperty(item._id)) {
        breakdown[item._id] = item.count;
      }
    });

    return {
      totalScholarshipApplications,
      breakdown,
    };
  }
}
