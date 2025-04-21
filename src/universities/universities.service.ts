import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { University, UniversityDocument } from './schemas/university.schema';

@Injectable()
export class UniversitiesService {
    constructor(
        @InjectModel(University.name)
        private universityModel: Model<UniversityDocument>,
    ) { }

    async create(createUniversityDto: CreateUniversityDto, userId: string) {
        const newUniversity = new this.universityModel({
            ...createUniversityDto,
            address_id: createUniversityDto.address_id ? Types.ObjectId.createFromHexString(createUniversityDto.address_id) : undefined,
            createdBy: Types.ObjectId.createFromHexString(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return await newUniversity.save();
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
            this.universityModel.find()
                .populate('address_id')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.universityModel.countDocuments(),
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
        return await this.universityModel.findById(id)
            .populate('address_id');
    }

    async update(id: string, updateUniversityDto: UpdateUniversityDto) {
        const updateData: any = { ...updateUniversityDto };

        // Convert string IDs to ObjectIds if they exist
        if (updateData.address_id) {
            updateData.address_id = Types.ObjectId.createFromHexString(updateData.address_id);
        }

        return await this.universityModel.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date(),
            },
            { new: true }
        );
    }

    async remove(id: string) {
        return await this.universityModel.findByIdAndDelete(id);
    }
} 