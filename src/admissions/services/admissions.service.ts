import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Admission, AdmissionDocument } from '../schemas/admission.schema';
import { CreateAdmissionDto } from '../dto/create-admission.dto';
import { UpdateAdmissionDto } from '../dto/update-admission.dto';
import { QueryAdmissionDto } from '../dto/query-admission.dto';
import { AdmissionsGateway } from '../gateways/admissions.gateway';

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectModel(Admission.name) private admissionModel: Model<AdmissionDocument>,
        private readonly admissionsGateway: AdmissionsGateway
    ) { }

    async create(createAdmissionDto: CreateAdmissionDto, userId: string): Promise<AdmissionDocument> {
        try {
            const createdAdmission = new this.admissionModel({
                ...createAdmissionDto,
                createdBy: new Types.ObjectId(userId),
                created_at: new Date(),
            });

            const savedAdmission = await createdAdmission.save();
            this.admissionsGateway.emitAdmissionUpdate(savedAdmission);
            return savedAdmission;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryAdmissionDto): Promise<{ data: AdmissionDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            university_id,
            campus_id,
            admission_deadline_before,
            admission_deadline_after,
            admission_startdate_before,
            admission_startdate_after,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const filter: any = {};

        // Apply filters
        if (university_id) {
            filter.university_id = new Types.ObjectId(university_id);
        }

        if (campus_id) {
            filter.campus_id = new Types.ObjectId(campus_id);
        }

        // Date range filters
        if (admission_deadline_before || admission_deadline_after) {
            filter.admission_deadline = {};
            if (admission_deadline_before) {
                filter.admission_deadline.$lte = new Date(admission_deadline_before);
            }
            if (admission_deadline_after) {
                filter.admission_deadline.$gte = new Date(admission_deadline_after);
            }
        }

        if (admission_startdate_before || admission_startdate_after) {
            filter.admission_startdate = {};
            if (admission_startdate_before) {
                filter.admission_startdate.$lte = new Date(admission_startdate_before);
            }
            if (admission_startdate_after) {
                filter.admission_startdate.$gte = new Date(admission_startdate_after);
            }
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { admission_title: { $regex: search, $options: 'i' } },
                { admission_description: { $regex: search, $options: 'i' } },
            ];
        }

        // Create query
        let query = this.admissionModel.find(filter);

        // Apply population if requested
        if (populate) {
            query = query.populate('university_id').populate('campus_id').populate('createdBy');
        }

        // Apply sorting
        query = query.sort({ [sortBy]: sortOrder as SortOrder });

        // Apply pagination
        query = query.skip(skip).limit(limit);

        // Execute query
        const data = await query.exec();
        const total = await this.admissionModel.countDocuments(filter);

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

    async findOne(id: string, populate: boolean = true): Promise<AdmissionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid admission ID');
        }

        let query = this.admissionModel.findById(id);

        if (populate) {
            query = query.populate('university_id').populate('campus_id').populate('createdBy');
        }

        const admission = await query.exec();

        if (!admission) {
            throw new NotFoundException(`Admission with ID ${id} not found`);
        }

        return admission;
    }

    async findByUniversity(universityId: string, queryDto: QueryAdmissionDto): Promise<{ data: AdmissionDocument[], meta: any }> {
        if (!Types.ObjectId.isValid(universityId)) {
            throw new BadRequestException('Invalid university ID');
        }

        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const filter = { university_id: new Types.ObjectId(universityId) };

        let query = this.admissionModel.find(filter);

        if (populate) {
            query = query.populate('campus_id').populate('createdBy');
        }

        query = query.sort({ [sortBy]: sortOrder as SortOrder });
        query = query.skip(skip).limit(limit);

        const data = await query.exec();
        const total = await this.admissionModel.countDocuments(filter);

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

    async findByCampus(campusId: string, queryDto: QueryAdmissionDto): Promise<{ data: AdmissionDocument[], meta: any }> {
        if (!Types.ObjectId.isValid(campusId)) {
            throw new BadRequestException('Invalid campus ID');
        }

        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const filter = { campus_id: new Types.ObjectId(campusId) };

        let query = this.admissionModel.find(filter);

        if (populate) {
            query = query.populate('university_id').populate('createdBy');
        }

        query = query.sort({ [sortBy]: sortOrder as SortOrder });
        query = query.skip(skip).limit(limit);

        const data = await query.exec();
        const total = await this.admissionModel.countDocuments(filter);

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

    async update(id: string, updateAdmissionDto: UpdateAdmissionDto): Promise<AdmissionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid admission ID');
        }

        // Convert string IDs to ObjectIds if they exist
        const updateData: any = { ...updateAdmissionDto };

        if (updateData.university_id) {
            updateData.university_id = new Types.ObjectId(updateData.university_id);
        }

        if (updateData.campus_id) {
            updateData.campus_id = new Types.ObjectId(updateData.campus_id);
        }

        const updatedAdmission = await this.admissionModel.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).exec();

        if (!updatedAdmission) {
            throw new NotFoundException(`Admission with ID ${id} not found`);
        }

        this.admissionsGateway.emitAdmissionUpdate(updatedAdmission);
        return updatedAdmission;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid admission ID');
        }

        const admission = await this.admissionModel.findById(id).exec();
        if (!admission) {
            throw new NotFoundException(`Admission with ID ${id} not found`);
        }

        await this.admissionModel.findByIdAndDelete(id).exec();

        this.admissionsGateway.emitAdmissionUpdate({
            _id: id,
            deleted: true,
            university_id: admission.university_id,
            campus_id: admission.campus_id
        });

        return { deleted: true };
    }
} 