import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
import { QueryApplicationDto } from '../dto/query-application.dto';
import { ApplicationsGateway } from '../gateways/applications.gateway';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
        private readonly applicationsGateway: ApplicationsGateway
    ) { }

    async create(createApplicationDto: CreateApplicationDto): Promise<ApplicationDocument> {
        try {
            const createdApplication = new this.applicationModel(createApplicationDto);
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

    async findAll(queryDto: QueryApplicationDto): Promise<{ data: ApplicationDocument[]; meta: any }> {
        try {
            const {
                student_id,
                program_id,
                admission_id,
                applicant_id,
                status,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
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

            const [applications, total] = await Promise.all([
                this.applicationModel
                    .find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('student_id', 'name email profile_image')
                    .populate('program_id')
                    .populate('admission_id')
                    .lean()
                    .exec(),
                this.applicationModel.countDocuments(filter).exec(),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data: applications,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            console.error('Error in findAll:', error);
            throw new Error('An error occurred while fetching applications');
        }
    }

    async findOne(id: string, populate: boolean = true): Promise<ApplicationDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid application ID');
        }

        let query = this.applicationModel.findById(id);

        if (populate) {
            query = query
                .populate('applicant')
                .populate('admission_program_id')
                .populate('campus_id')
                .populate('program')
                .populate('departments.department')
                .populate('departments.preferences.program');
        }

        const application = await query.exec();

        if (!application) {
            throw new NotFoundException(`Application with ID ${id} not found`);
        }

        return application;
    }

    async findByApplicant(applicantId: string, queryDto: QueryApplicationDto): Promise<{ data: ApplicationDocument[], meta: any }> {
        if (!Types.ObjectId.isValid(applicantId)) {
            throw new BadRequestException('Invalid applicant ID');
        }

        return this.findAll({
            ...queryDto,
            applicant_id: applicantId
        });
    }

    async update(id: string, updateApplicationDto: UpdateApplicationDto): Promise<ApplicationDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid application ID');
        }

        const updatedApplication = await this.applicationModel.findByIdAndUpdate(
            id,
            updateApplicationDto,
            { new: true, runValidators: true }
        ).exec();

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

        const updatedApplication = await this.applicationModel.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).exec();

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
            program: application.program
        });

        return { deleted: true };
    }

    async getApplicationStatistics(): Promise<any> {
        const stats = await this.applicationModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]).exec();

        const totalApplications = await this.applicationModel.countDocuments();

        const result = {
            total: totalApplications,
            byStatus: {}
        };

        stats.forEach(stat => {
            result.byStatus[stat._id] = stat.count;
        });

        return result;
    }
} 