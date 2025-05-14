import { Injectable, Query, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { University, UniversityDocument } from './schemas/university.schema';
import { Program, ProgramDocument } from '../programs/schemas/program.schema';
import { Campus, CampusDocument } from '../campuses/schemas/campus.schema';
import { RootFilterQuery } from 'mongoose';
import { QueryUniversityDto } from './dto/query-university.dto';

@Injectable()
export class UniversitiesService {
    constructor(
        @InjectModel(University.name)
        private universityModel: Model<UniversityDocument>,
        @InjectModel(Program.name)
        private programModel: Model<ProgramDocument>,
        @InjectModel(Campus.name)
        private campusModel: Model<CampusDocument>,
    ) { }


    private async extractUniversityIdsWithOpenPrograms(): Promise<string[]> {
        
        // First, get unique campus IDs that have programs
        const campusIdsWithPrograms = await this.programModel.aggregate([
            {
                $group: {
                    _id: '$campus_id'
                }
            }
        ]).exec();

        // Extract the unique campus IDs
        const uniqueCampusIds = campusIdsWithPrograms.map(item => new Types.ObjectId(item._id));

        // Then, get unique university IDs from those campuses
        const universityIdsWithPrograms = await this.campusModel.aggregate([
            {
                $match: {
                    _id: { $in: uniqueCampusIds }
                }
            },
            {
                $group: {
                    _id: '$university_id'
                }
            }
        ]).exec();

        // Extract the university IDs
        const uniqueUniversityIds = universityIdsWithPrograms.map(item => item._id);
        
        return uniqueUniversityIds;
    }
    
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
        queryDto: QueryUniversityDto,
        overrideFilter: RootFilterQuery<UniversityDocument> = {}
    ) {
        const { page, limit, sortOrder, sortBy, name: nameSearch } = queryDto;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder };

        if (nameSearch){
            overrideFilter = {
                ...overrideFilter,
               name: { $regex: nameSearch, $options: 'i' } 
            }
        }

        const [data, total] = await Promise.all([
            this.universityModel.find(overrideFilter)
                .populate('address_id')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.universityModel.countDocuments(overrideFilter),
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

    async findAllWithOpenPrograms(queryDto: QueryUniversityDto) {
        const uniqueUniversityIds = await this.extractUniversityIdsWithOpenPrograms();

        // Finally, get the universities with pagination
        const result = await this.findAll(queryDto, {
            _id: { $in: uniqueUniversityIds }
        });

        return result;
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