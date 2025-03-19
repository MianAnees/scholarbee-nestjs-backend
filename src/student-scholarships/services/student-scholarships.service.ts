import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { StudentScholarship, StudentScholarshipDocument } from '../schemas/student-scholarship.schema';
import { CreateStudentScholarshipDto } from '../dto/create-student-scholarship.dto';
import { UpdateStudentScholarshipDto } from '../dto/update-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';

@Injectable()
export class StudentScholarshipsService {
    constructor(
        @InjectModel(StudentScholarship.name) private studentScholarshipModel: Model<StudentScholarshipDocument>
    ) { }

    async create(createStudentScholarshipDto: CreateStudentScholarshipDto): Promise<StudentScholarshipDocument> {
        try {
            const createdScholarship = new this.studentScholarshipModel(createStudentScholarshipDto);
            return await createdScholarship.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryStudentScholarshipDto): Promise<{ data: StudentScholarshipDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            scholarship_name,
            scholarship_type,
            university_id,
            country,
            region,
            status,
            deadlineFrom,
            deadlineTo,
            amountMin,
            amountMax,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: { [key: string]: SortOrder } = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const filter: any = {};

        if (scholarship_name) {
            filter.scholarship_name = { $regex: new RegExp(scholarship_name, 'i') };
        }

        if (scholarship_type) {
            filter.scholarship_type = scholarship_type;
        }

        if (university_id) {
            filter.university_id = new Types.ObjectId(university_id);
        }

        if (country) {
            filter.country = new Types.ObjectId(country);
        }

        if (region) {
            filter.region = new Types.ObjectId(region);
        }

        if (status) {
            filter.status = status;
        }

        if (deadlineFrom || deadlineTo) {
            filter.application_deadline = {};
            if (deadlineFrom) {
                filter.application_deadline.$gte = new Date(deadlineFrom);
            }
            if (deadlineTo) {
                filter.application_deadline.$lte = new Date(deadlineTo);
            }
        }

        if (amountMin !== undefined || amountMax !== undefined) {
            filter.amount = {};
            if (amountMin !== undefined) {
                filter.amount.$gte = amountMin;
            }
            if (amountMax !== undefined) {
                filter.amount.$lte = amountMax;
            }
        }

        if (search) {
            filter.$or = [
                { scholarship_name: { $regex: new RegExp(search, 'i') } },
                { scholarship_description: { $regex: new RegExp(search, 'i') } },
                { eligibility_criteria: { $regex: new RegExp(search, 'i') } }
            ];
        }

        let query = this.studentScholarshipModel.find(filter);

        if (populate) {
            query = query.populate('university_id').populate('country').populate('region');
        }

        const [data, total] = await Promise.all([
            query.sort(sortOptions).skip(skip).limit(limit).exec(),
            this.studentScholarshipModel.countDocuments(filter).exec()
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        };

        return { data, meta };
    }

    async findOne(id: string): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const scholarship = await this.studentScholarshipModel
            .findById(id)
            .populate('university_id')
            .populate('country')
            .populate('region')
            .exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return scholarship;
    }

    async update(id: string, updateStudentScholarshipDto: UpdateStudentScholarshipDto): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const updatedScholarship = await this.studentScholarshipModel
            .findByIdAndUpdate(id, updateStudentScholarshipDto, { new: true })
            .populate('university_id')
            .populate('country')
            .populate('region')
            .exec();

        if (!updatedScholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return updatedScholarship;
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

    async findByUniversity(universityId: string, queryDto: QueryStudentScholarshipDto): Promise<{ data: StudentScholarshipDocument[], meta: any }> {
        if (!Types.ObjectId.isValid(universityId)) {
            throw new BadRequestException('Invalid university ID');
        }

        queryDto.university_id = universityId;
        return this.findAll(queryDto);
    }

    async addRequiredDocument(id: string, document: { id: string; document_name: string }): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const scholarship = await this.studentScholarshipModel.findById(id).exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        scholarship.required_documents.push(document);
        return await scholarship.save();
    }

    async removeRequiredDocument(id: string, documentId: string): Promise<StudentScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const scholarship = await this.studentScholarshipModel.findById(id).exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        scholarship.required_documents = scholarship.required_documents.filter(doc => doc.id !== documentId);
        return await scholarship.save();
    }
} 