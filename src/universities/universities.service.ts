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
import { Admission, AdmissionDocument, AdmissionStatusEnum } from '../admissions/schemas/admission.schema';

@Injectable()
export class UniversitiesService {
    constructor(
        @InjectModel(University.name)
        private universityModel: Model<UniversityDocument>,
        @InjectModel(Program.name)
        private programModel: Model<ProgramDocument>,
        @InjectModel(Campus.name)
        private campusModel: Model<CampusDocument>,
        @InjectModel(Admission.name)
        private admissionModel: Model<AdmissionDocument>,
    ) { }


    // TODO: Instead of searching through the programs, get a list of unique university ids in the `admission` collection
    private async extractUniversityIdsWithAvailablePrograms(admission_program_status: AdmissionStatusEnum): Promise<string[]> {
        
        let universityIds: string[] = [];

        if (admission_program_status === AdmissionStatusEnum.UNAVAILABLE) {
            // Find universities that do NOT have any corresponding documents in the admissions collection.
            const universitiesWithoutAdmissions = await this.universityModel.aggregate([
                {
                    $lookup: {
                        from: 'admissions', // The name of the admissions collection
                        localField: '_id', // Field from the universities collection
                        foreignField: 'university_id', // Field from the admissions collection
                        as: 'admissions' // Output array field
                    }
                },
                {
                    $match: {
                        admissions: { $size: 0 } // Filter out universities that have no admissions
                    }
                },
                {
                    $project: {
                        _id: 1 // Only return the university ID
                    }
                }
            ]).exec();
            universityIds = universitiesWithoutAdmissions.map(u => u._id.toString());

        } else if (admission_program_status === AdmissionStatusEnum.AVAILABLE) {
            // For AdmissionStatusEnum.AVAILABLE, get all university IDs that have any admission document.
            const universitiesWithMatchingAdmissions = await this.admissionModel.aggregate([
                {
                    $group: {
                        _id: '$university_id'
                    }
                }
            ]).exec();
            universityIds = universitiesWithMatchingAdmissions.map(item => item._id.toString());
        }
        // If admission_program_status is not AVAILABLE or UNAVAILABLE, it will return an empty array,
        // effectively not filtering by admission status if other statuses like OPEN/CLOSED are passed.
        // Or, we could choose to make AVAILABLE the default if no specific status we handle is passed.
        // For now, let's stick to explicit handling.
        
        return universityIds;
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
        const { page, limit, sortOrder, sortBy, name: nameSearch,admission_program_status } = queryDto;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder };

        if (nameSearch){
            overrideFilter = {
                ...overrideFilter,
               name: { $regex: nameSearch, $options: 'i' } 
            }
        }

        // if `admission_program_status` is provided, add a filter to the overrideFilter
        if (admission_program_status){

            // get the university ids with available programs
            const universityIdsWithAvailablePrograms = await this.extractUniversityIdsWithAvailablePrograms(admission_program_status);
            
            overrideFilter = {
                ...overrideFilter,
                _id: { $in: universityIdsWithAvailablePrograms }
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
    async findAllWithAvailablePrograms(queryDto: QueryUniversityDto) {
        const uniqueUniversityIds = await this.extractUniversityIdsWithAvailablePrograms();

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