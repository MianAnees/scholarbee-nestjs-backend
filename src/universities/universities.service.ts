import { Injectable, Query, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, SortOrder, Types } from 'mongoose';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { University, UniversityDocument } from './schemas/university.schema';
import { Program, ProgramDocument } from '../programs/schemas/program.schema';
import { Campus, CampusDocument } from '../campuses/schemas/campus.schema';
import { RootFilterQuery } from 'mongoose';
import { QueryUniversityDto } from './dto/query-university.dto';
import { Admission, AdmissionDocument, AdmissionStatusEnum } from '../admissions/schemas/admission.schema';
import { getDataAndCountAggPipeline, getSortOrder } from 'src/utils/db.utils';

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

    private buildAdmissionStatusAggStages(admission_program_status: AdmissionStatusEnum) {
        const associatedAdmissionsLookupStage = {
            $lookup: {
                from: 'admissions', // The name of the admissions collection
                // localField: '_id', // Field from the universities collection
                // foreignField: 'university_id', // Field from the admissions collection
                let: { universityIdStr: { $toString: '$_id' } }, // Convert ObjectId to string
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$university_id', '$$universityIdStr']
                            }
                        }
                    }
                ],
                as: '__associated_admissions' // Output array field
            }
        };

        if (admission_program_status === AdmissionStatusEnum.UNAVAILABLE) {
            return [
                associatedAdmissionsLookupStage,
                {
                    $match: {
                        __associated_admissions: { $size: 0 } // Filter out universities that have no admissions
                    }
                }
            ];
        } else if (admission_program_status === AdmissionStatusEnum.AVAILABLE) {
            return [
                associatedAdmissionsLookupStage,
                {
                    $match: {
                        __associated_admissions: { $not: { $size: 0 } } // Filter for universities that have at least one admission
                    }
                }
            ];
        }
        return []; // Should not happen if called correctly, or handle default
    }
    
    private getAddressPopulationStages(): any[] {
        return [
            {
                $lookup: {
                    from: 'addresses',
                    let: { addressObjectId: { $toObjectId: '$address_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$addressObjectId']
                                }
                            }
                        }
                    ],
                    as: 'address_id'
                }
            },
            {
                $unwind: {
                    path: '$address_id',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
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
        const { page, limit, sortOrder, sortBy, name: nameSearch, admission_program_status } = queryDto;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: getSortOrder(sortOrder) } as const;

        const filterPipeline: PipelineStage[] = [];

        // Conditionally add admission status stages
        if (admission_program_status) {
            filterPipeline.push(...this.buildAdmissionStatusAggStages(admission_program_status));
        }

        // Add name search filter if present
        if (nameSearch) {
            filterPipeline.push({ $match: { name: { $regex: nameSearch, $options: 'i' } } });
        }

        // Add any other overrideFilter conditions
        const remainingOverrideFilter = { ...overrideFilter } as any;
        if (remainingOverrideFilter.name) delete remainingOverrideFilter.name;
        if (Object.keys(remainingOverrideFilter).length > 0) {
            filterPipeline.push({ $match: remainingOverrideFilter });
        }

        // Always add address population stages
        filterPipeline.push(...this.getAddressPopulationStages());

        // Remove temp fields
        filterPipeline.push({ $project: { __associated_admissions: 0 } });


        // Data and count pipelines
        // TODO: Append the method to all model schemas such that we can use it like this:
        // universityModel.dataAndCountAggregate(filterPipeline, sort, limit, skip);
        const { dataPipeline, countPipeline } = getDataAndCountAggPipeline(filterPipeline, sort, limit, skip);
     
        const [data, countDocArr] = await Promise.all([
            this.universityModel.aggregate(dataPipeline).exec(),
            this.universityModel.aggregate(countPipeline).exec()
        ]);
        const total = Number(countDocArr.at(0)?.total);

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

        queryDto.admission_program_status = AdmissionStatusEnum.AVAILABLE;

        // Finally, get the universities with pagination
        const result = await this.findAll(queryDto);

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