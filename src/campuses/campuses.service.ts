import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { Campus, CampusDocument } from './schemas/campus.schema';

@Injectable()
export class CampusesService {
    constructor(
        @InjectModel(Campus.name)
        private campusModel: Model<CampusDocument>,
    ) { }

    async create(createCampusDto: CreateCampusDto, userId: string) {
        const newCampus = new this.campusModel({
            ...createCampusDto,
            university_id: createCampusDto.university_id ? Types.ObjectId.createFromHexString(createCampusDto.university_id) : undefined,
            address_id: createCampusDto.address_id ? Types.ObjectId.createFromHexString(createCampusDto.address_id) : undefined,
            createdBy: Types.ObjectId.createFromHexString(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return await newCampus.save();
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        sortBy: string = 'createdAt',
        order: SortOrder = 'desc',
    ) {
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: order };

        const [data, total] = await Promise.all([
            this.campusModel.find()
                .populate('university_id')
                .populate('address_id')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.campusModel.countDocuments(),
        ]);

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

    async findOne(id: string) {
        return await this.campusModel.findById(id)
            .populate('university_id')
            .populate('address_id');
    }

    async findByUniversity(universityId: string) {
        return await this.campusModel.find({ university_id: universityId });
    }

    async update(id: string, updateCampusDto: UpdateCampusDto) {
        // Create a copy of the DTO to avoid modifying the original
        const updateData: any = { ...updateCampusDto };

        // Convert string IDs to ObjectIds if they exist
        if (updateData.university_id) {
            updateData.university_id = Types.ObjectId.createFromHexString(updateData.university_id);
        }

        if (updateData.address_id) {
            updateData.address_id = Types.ObjectId.createFromHexString(updateData.address_id);
        }

        return await this.campusModel.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date(),
            },
            { new: true }
        );
    }

    async remove(id: string) {
        return await this.campusModel.findByIdAndDelete(id);
    }
} 