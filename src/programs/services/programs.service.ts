import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder, RootFilterQuery } from 'mongoose';
import { Program, ProgramDocument } from '../schemas/program.schema';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { QueryProgramDto } from '../dto/query-program.dto';
import { CompareProgramsDto } from '../dto/compare-programs.dto';

@Injectable()
export class ProgramsService {
    constructor(
        @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
    ) { }

    private buildFilterQuery(queryDto: QueryProgramDto): RootFilterQuery<ProgramDocument> {
        const {
            search,
            name,
            major,
            mode_of_study,
            campus_id,
            campus_ids,
            degree_level,
            academic_departments,
        } = queryDto;

        const filter: RootFilterQuery<ProgramDocument> = {};

        // Apply filters
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { major: { $regex: search, $options: 'i' } }
            ];
        }

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (major) {
            filter.major = { $regex: major, $options: 'i' };
        }

        if (mode_of_study) {
            filter.mode_of_study = { $regex: mode_of_study, $options: 'i' };
        }

        if (degree_level) {
            filter.degree_level = { $regex: degree_level, $options: 'i' };
        }

        // Handle both single campus_id and multiple campus_ids
        if (campus_ids?.length) {
            filter.campus_id = { $in: campus_ids };
        } else if (campus_id) {
            filter.campus_id = campus_id;
        }

        if (academic_departments) {
            filter.academic_departments = academic_departments;
        }

        return filter;
    }

    async create(createProgramDto: CreateProgramDto): Promise<ProgramDocument> {
        try {
            const createdProgram = new this.programModel(createProgramDto);
            return await createdProgram.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }


    async findAll(queryDto: QueryProgramDto): Promise<{ programs: ProgramDocument[], total: number, page: number, limit: number, totalPages: number }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const filter = this.buildFilterQuery(queryDto);

        // Sort options
        const sort: { [key: string]: SortOrder } = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const programs = await this.programModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();

        // Get total count
        const total = await this.programModel.countDocuments(filter).exec();
        const totalPages = Math.ceil(total / limit);

        if (populate) {
            // Implement population logic here if needed
        }

        return {
            programs,
            total,
            page,
            limit,
            totalPages
        };
    }

    async findOne(id: string, populate: boolean = true): Promise<ProgramDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program ID');
        }

        const program = await this.programModel.findById(id).exec();

        if (!program) {
            throw new NotFoundException(`Program with ID ${id} not found`);
        }

        // Populate references if requested
        if (populate) {
            // You would implement population logic here based on your schema relationships
            // For example:
            // await program.populate('campus').execPopulate();
            // await program.populate('academic_departments').execPopulate();
        }

        return program;
    }

    async update(id: string, updateProgramDto: UpdateProgramDto): Promise<ProgramDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program ID');
        }

        const updatedProgram = await this.programModel.findByIdAndUpdate(
            id,
            { $set: updateProgramDto },
            { new: true, runValidators: true }
        ).exec();

        if (!updatedProgram) {
            throw new NotFoundException(`Program with ID ${id} not found`);
        }

        return updatedProgram;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program ID');
        }

        const result = await this.programModel.deleteOne({ _id: id }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Program with ID ${id} not found`);
        }

        return { deleted: true };
    }

    async findByCampus(campusId: string, queryDto: QueryProgramDto): Promise<{ programs: ProgramDocument[], total: number, page: number, limit: number, totalPages: number }> {
        if (!Types.ObjectId.isValid(campusId)) {
            throw new BadRequestException('Invalid campus ID');
        }

        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', populate = true } = queryDto;
        const skip = (page - 1) * limit;

        // Sort options
        const sort: { [key: string]: SortOrder } = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const programs = await this.programModel
            .find({ campus_id: campusId })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();

        // Get total count
        const total = await this.programModel.countDocuments({ campus_id: campusId }).exec();
        const totalPages = Math.ceil(total / limit);

        // Populate references if requested
        if (populate) {
            // Implement population logic here
        }

        return {
            programs,
            total,
            page,
            limit,
            totalPages
        };
    }

    async findByAcademicDepartment(departmentId: string, queryDto: QueryProgramDto): Promise<{ programs: ProgramDocument[], total: number, page: number, limit: number, totalPages: number }> {
        if (!Types.ObjectId.isValid(departmentId)) {
            throw new BadRequestException('Invalid academic department ID');
        }

        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', populate = true } = queryDto;
        const skip = (page - 1) * limit;

        // Sort options
        const sort: { [key: string]: SortOrder } = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const programs = await this.programModel
            .find({ academic_departments: departmentId })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();

        // Get total count
        const total = await this.programModel.countDocuments({ academic_departments: departmentId }).exec();
        const totalPages = Math.ceil(total / limit);

        // Populate references if requested
        if (populate) {
            // Implement population logic here
        }

        return {
            programs,
            total,
            page,
            limit,
            totalPages
        };
    }

    async getStatistics(): Promise<any> {
        // Get count by mode of study
        const modeOfStudyStats = await this.programModel.aggregate([
            { $group: { _id: '$mode_of_study', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).exec();

        // Get count by campus
        const campusStats = await this.programModel.aggregate([
            { $group: { _id: '$campus_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).exec();

        // Get count by academic department
        const departmentStats = await this.programModel.aggregate([
            { $match: { academic_departments: { $exists: true, $ne: null } } },
            { $group: { _id: '$academic_departments', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).exec();

        // Total programs
        const totalPrograms = await this.programModel.countDocuments().exec();

        return {
            totalPrograms,
            modeOfStudyStats,
            campusStats,
            departmentStats
        };
    }

    async comparePrograms(compareProgramsDto: CompareProgramsDto): Promise<any[]> {
        const { programIds } = compareProgramsDto;

        // Convert string IDs to ObjectIds
        const objectIds = programIds.map(id => new Types.ObjectId(id));

        const comparisonData = await this.programModel.aggregate([
            // Match the specified program IDs
            {
                $match: {
                    _id: { $in: objectIds }
                }
            },
            // Lookup campus details
            {
                $lookup: {
                    from: 'campuses',
                    let: { campusId: { $toObjectId: '$campus_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$campusId'] }
                            }
                        }
                    ],
                    as: 'campus'
                }
            },
            {
                $unwind: {
                    path: '$campus',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup address details
            {
                $lookup: {
                    from: 'addresses',
                    let: { addressId: { $toObjectId: '$campus.address_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$addressId'] }
                            }
                        }
                    ],
                    as: 'campusAddress'
                }
            },
            {
                $unwind: {
                    path: '$campusAddress',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup fee structures
            {
                $lookup: {
                    from: 'fee_structures',
                    let: { programId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        { $toObjectId: '$program_id' },
                                        { $toString: '$$programId' }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'fees'
                }
            },
            {
                $unwind: {
                    path: '$fees',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup university details
            {
                $lookup: {
                    from: 'universities',
                    let: { universityId: { $toObjectId: '$campus.university_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$universityId'] }
                            }
                        }
                    ],
                    as: 'university'
                }
            },
            {
                $unwind: {
                    path: '$university',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Add tuitionFee and applicationFee fields with default values
            {
                $addFields: {
                    tuitionFee: { $ifNull: ['$fees.tuition_fee', 0] },
                    applicationFee: { $ifNull: ['$fees.application_fee', 0] }
                }
            },
            // Group the results
            {
                $group: {
                    _id: '$_id',
                    programName: { $first: '$name' },
                    major: { $first: '$major' },
                    duration: { $first: '$duration' },
                    creditHours: { $first: '$credit_hours' },
                    degreeLevel: { $first: '$degree_level' },
                    modeOfStudy: { $first: '$mode_of_study' },
                    languageOfInstruction: { $first: '$language_of_instruction' },
                    campusName: { $first: '$campus.name' },
                    campusFacilities: { $first: '$campus.facilities' },
                    campusLogo: { $first: '$campus.logo_url' },
                    campusAddress: { $first: '$campusAddress' },
                    universityName: { $first: '$university.name' },
                    universityRanking: { $first: '$university.ranking' },
                    totalTuitionFee: { $sum: '$tuitionFee' },
                    totalApplicationFee: { $sum: '$applicationFee' },
                    currency: { $first: '$fees.currency' }
                }
            },
            // Calculate total fee
            {
                $addFields: {
                    totalFee: {
                        $add: ['$totalTuitionFee', '$totalApplicationFee']
                    }
                }
            }
        ]);

        return comparisonData;
    }

    async findAllByUniversity(
        universityId: string,
        queryDto: QueryProgramDto
    ): Promise<{ programs: ProgramDocument[], total: number, page: number, limit: number, totalPages: number }> {
        if (!Types.ObjectId.isValid(universityId)) {
            throw new BadRequestException('Invalid university ID');
        }

        // Get campus IDs for the university
        const campusesAggregation = await this.programModel.aggregate([
            {
                $lookup: {
                    from: 'campuses',
                    let: { campusId: { $toObjectId: '$campus_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', '$$campusId'] },
                                        { $eq: ['$university_id', universityId] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'campus'
                }
            },
            {
                $match: { 'campus': { $ne: [] } }
            },
            {
                $group: { _id: '$campus_id' }
            }
        ]).exec();

        const campusIds = campusesAggregation.map(item => item._id);

        if (campusIds.length === 0) {
            return {
                programs: [],
                total: 0,
                page: 1,
                limit: queryDto.limit || 10,
                totalPages: 0
            };
        }

        // Merge the campus IDs with the query DTO and reuse findAll
        return this.findAll({
            ...queryDto,
            campus_ids: campusIds
        });
    }
} 