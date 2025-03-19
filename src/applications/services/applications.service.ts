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

    async findAll(queryDto: QueryApplicationDto): Promise<{ data: ApplicationDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            applicant,
            admission_program_id,
            campus_id,
            program,
            status,
            submissionDateFrom,
            submissionDateTo,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder as SortOrder };

        // Build filter
        const filter: any = {};

        if (search) {
            // Search in relevant fields
            filter.$or = [
                { 'applicant_snapshot.first_name': { $regex: search, $options: 'i' } },
                { 'applicant_snapshot.last_name': { $regex: search, $options: 'i' } },
                { 'applicant_snapshot.email': { $regex: search, $options: 'i' } },
                { 'applicant_snapshot.phone_number': { $regex: search, $options: 'i' } },
                { 'applicant_snapshot.city': { $regex: search, $options: 'i' } },
                { 'applicant_snapshot.districtOfDomicile': { $regex: search, $options: 'i' } }
            ];
        }

        if (applicant) {
            filter.applicant = applicant;
        }

        if (admission_program_id) {
            filter.admission_program_id = admission_program_id;
        }

        if (campus_id) {
            filter.campus_id = campus_id;
        }

        if (program) {
            filter.program = program;
        }

        if (status) {
            filter.status = status;
        }

        // Date range filter
        if (submissionDateFrom || submissionDateTo) {
            filter.submission_date = {};

            if (submissionDateFrom) {
                filter.submission_date.$gte = submissionDateFrom;
            }

            if (submissionDateTo) {
                filter.submission_date.$lte = submissionDateTo;
            }
        }

        // Execute query
        let query = this.applicationModel.find(filter);

        // Apply population if requested
        if (populate) {
            query = query
                .populate('applicant')
                .populate('admission_program_id')
                .populate('campus_id')
                .populate('program')
                .populate('departments.department')
                .populate('departments.preferences.program');
        }

        // Get total count for pagination
        const total = await this.applicationModel.countDocuments(filter);

        // Apply sorting and pagination
        const data = await query
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .exec();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
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
            applicant: applicantId
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