import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import { Scholarship, ScholarshipDocument } from 'src/scholarships/schemas/scholarship.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { CreateStudentScholarshipDto } from '../dto/create-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';
import { AddRequiredDocumentDto, RemoveRequiredDocumentDto, UpdateStudentScholarshipApprovalStatusDto, UpdateStudentScholarshipDto } from '../dto/update-student-scholarship.dto';
import { FatherLivingStatusEnum, IStudentScholarship, ScholarshipApprovalStatusEnum, StudentScholarship, StudentScholarshipDocument } from '../schemas/student-scholarship.schema';

@Injectable()
export class StudentScholarshipsService {
    constructor(
        @InjectModel(StudentScholarship.name) private studentScholarshipModel: Model<StudentScholarshipDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Scholarship.name) private scholarshipModel: Model<ScholarshipDocument>
    ) { }


    async createUserSnapshot(
        userId: string,
        clientSnapshotData: Pick<IStudentScholarship['student_snapshot'], 'last_degree' | 'monthly_household_income' | 'father_status'>

    ): Promise<IStudentScholarship['student_snapshot']> {
        const user = await this.userModel.findById(userId).exec();

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.father_name || !user.provinceOfDomicile) {
            throw new BadRequestException('Incomplete data in profile. Please complete your profile to continue.');
        }

        // Create a partial snapshot with data from the user document
        const userSnapshot: IStudentScholarship['student_snapshot'] = {
            name: `${user.first_name} ${user.last_name}`,
            father_name: user.father_name,
            father_status: clientSnapshotData.father_status || user.father_status || FatherLivingStatusEnum.Alive,
            domicile: user.provinceOfDomicile, // REVIEW: Are we supposed to check the province or district of domicile?
            monthly_household_income: clientSnapshotData.monthly_household_income,
            last_degree: clientSnapshotData.last_degree,
        };

        // Return the partial snapshot - client will need to provide:
        // - monthly_household_income
        // - last_degree (level and percentage)
        return userSnapshot;
    }


    /**
     * Create a new student scholarship application against a scholarship on behalf of a student
     */
    async create(createStudentScholarshipDto: CreateStudentScholarshipDto, userId: string): Promise<StudentScholarshipDocument> {
        try {
            // Verify the student_id and scholarship_id are valid entries in the database
            const student = await this.userModel.findById(createStudentScholarshipDto.student_id).exec();
            const scholarship = await this.scholarshipModel.findById(createStudentScholarshipDto.scholarship_id).exec();
            if (!student) {
                throw new NotFoundException(`Student with ID ${createStudentScholarshipDto.student_id} not found`);
            }
            if (!scholarship) {
                throw new NotFoundException(`Scholarship with ID ${createStudentScholarshipDto.scholarship_id} not found`);
            }


            // Check if the student has already applied for this scholarship
            // REVIEW: Is the user allowed to apply twice? 
            // REVIEW: What if the previous application was rejected?
            // REVIEW: Is there a re-apply threshold after which a rejected student can apply?
            const existingApplication = await this.studentScholarshipModel.findOne({
                student_id: createStudentScholarshipDto.student_id,
                scholarship_id: createStudentScholarshipDto.scholarship_id
            });

            if (existingApplication) {
                throw new ConflictException('You have already applied for this scholarship');
            }

            // Get user snapshot data from the database
            const userSnapshot = await this.createUserSnapshot(userId, createStudentScholarshipDto.student_snapshot);

            const newStudentScholarshipApplication: IStudentScholarship = {
                ...createStudentScholarshipDto,
                student_snapshot: userSnapshot,
                createdBy: new Types.ObjectId(userId),
                application_date: new Date(),
                approval_status: ScholarshipApprovalStatusEnum.Applied,
            }


            // Create a new student scholarship application
            const createdApplication = new this.studentScholarshipModel(newStudentScholarshipApplication);
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
                    studentIds: { $addToSet: '$student_id' }
                }
            }
        ];

        const result = await this.studentScholarshipModel.aggregate(pipeline).exec();
        console.log('Unique student_ids in collection:', result[0]?.studentIds);
    }

    async findAll(queryDto: QueryStudentScholarshipDto): Promise<{ data: StudentScholarshipDocument[]; meta: any }> {
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
                populate = true
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
                query
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.studentScholarshipModel.countDocuments(filter).exec(),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data: scholarships,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
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
     */
    async update(id: string, updateStudentScholarshipDto: UpdateStudentScholarshipDto): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const previousApplication = await this.studentScholarshipModel.findById(id).exec();

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
                    ...updateStudentScholarshipDto.student_snapshot.last_degree
                }
            }
        };

        // Update the document and return the new version
        const updatedScholarship = await this.studentScholarshipModel
            .findByIdAndUpdate(
                id,
                { $set: updatedData },
                { new: true }
            )
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

    async updateApprovalStatus(id: string, updateStudentScholarshipApprovalStatusDto: UpdateStudentScholarshipApprovalStatusDto): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid application ID');
        }

        const application = await this.studentScholarshipModel.findById(id);

        if (!application) {
            throw new NotFoundException(`Application with ID ${id} not found`);
        }

        application.approval_status = updateStudentScholarshipApprovalStatusDto.approval_status;
        return await application.save();
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const result = await this.studentScholarshipModel.findByIdAndDelete(id).exec();

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
                        count: { $sum: 1 }
                    }
                }
            ]),
            this.studentScholarshipModel.aggregate([
                {
                    $group: {
                        _id: '$university_id',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                }
            ]),
            this.studentScholarshipModel.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
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
            }, {})
        };
    }


    async addRequiredDocument(studentScholarshipId: Types.ObjectId, addRequiredDocumentDto: AddRequiredDocumentDto): Promise<StudentScholarshipDocument> {

        const scholarship = await this.studentScholarshipModel.findById(studentScholarshipId).exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${studentScholarshipId} not found`);
        }
        const document = addRequiredDocumentDto.document;

        scholarship.required_documents.push(document);
        return await scholarship.save();
    }

    async removeRequiredDocument(studentScholarshipId: Types.ObjectId, removeRequiredDocumentDto: RemoveRequiredDocumentDto): Promise<StudentScholarshipDocument> {

        const scholarship = await this.studentScholarshipModel.findById(studentScholarshipId).exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${studentScholarshipId} not found`);
        }

        const documentName = removeRequiredDocumentDto.document_name;

        scholarship.required_documents = scholarship.required_documents.filter(doc => doc.document_name !== documentName);
        return await scholarship.save();
    }
} 