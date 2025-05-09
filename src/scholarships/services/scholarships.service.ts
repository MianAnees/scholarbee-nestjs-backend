import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scholarship, ScholarshipDocument } from '../schemas/scholarship.schema';
import { CreateScholarshipDto } from '../dto/create-scholarship.dto';
import { QueryScholarshipDto } from '../dto/query-scholarship.dto';

@Injectable()
export class ScholarshipsService {
    constructor(
        @InjectModel(Scholarship.name) private scholarshipModel: Model<ScholarshipDocument>
    ) { }

    async create(createScholarshipDto: CreateScholarshipDto, userId: string): Promise<ScholarshipDocument> {
        try {
            const scholarship = new this.scholarshipModel({
                ...createScholarshipDto,
                createdBy: userId
            });
            return await scholarship.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryScholarshipDto): Promise<{ data: ScholarshipDocument[]; meta: any }> {
        const {
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
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
            populate = true
        } = queryDto;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { scholarship_name: { $regex: search, $options: 'i' } },
                { scholarship_description: { $regex: search, $options: 'i' } }
            ];
        }

        if (scholarship_name) {
            filter.scholarship_name = { $regex: scholarship_name, $options: 'i' };
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
                filter.application_deadline.$gte = deadlineFrom;
            }
            if (deadlineTo) {
                filter.application_deadline.$lte = deadlineTo;
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

        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        let query = this.scholarshipModel.find(filter);

        if (populate) {
            query = query
                .populate('university_id')
                // .populate('country')
                .populate('region');
        }

        const [scholarships, total] = await Promise.all([
            query
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.scholarshipModel.countDocuments(filter).exec(),
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
    }

    async findOne(id: string): Promise<ScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const scholarship = await this.scholarshipModel
            .findById(id)
            .populate('university_id')
            //  .populate('country')
            .populate('region')
            .exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return scholarship;
    }

    async update(id: string, updateScholarshipDto: Partial<CreateScholarshipDto>): Promise<ScholarshipDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const scholarship = await this.scholarshipModel
            .findByIdAndUpdate(id, updateScholarshipDto, { new: true })
            .populate('university_id')
            // .populate('country')
            .populate('region')
            .exec();

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return scholarship;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid scholarship ID');
        }

        const result = await this.scholarshipModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return { deleted: true };
    }
} 