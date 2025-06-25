import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, SortOrder, Types } from 'mongoose';
import { QueryAdmissionProgramDegreeLevelsDto } from 'src/admission-programs/dto/query-admission-program-degree-levels.dto';
import { QueryAdmissionProgramMajorsDto } from 'src/admission-programs/dto/query-admission-program-majors.dto';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history.analytics.service';
import {
  ISearchHistoryIndexDoc,
  SearchResourceEnum,
} from 'src/elasticsearch/mappings/search-history.mapping';
import { UserNS } from 'src/users/schemas/user.schema';
import { CreateAdmissionProgramDto } from '../dto/create-admission-program.dto';
import { FilterAdmissionProgramDto } from '../dto/filter-admission-program.dto';
import { QueryAdmissionProgramDto } from '../dto/query-admission-program.dto';
import { UpdateAdmissionProgramDto } from '../dto/update-admission-program.dto';
import { AdmissionProgramsGateway } from '../gateways/admission-programs.gateway';
import {
  AdmissionProgram,
  AdmissionProgramDocument,
} from '../schemas/admission-program.schema';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { QueryAdmissionProgramByIdDto } from '../dto/query-admission-program.dto';

@Injectable()
export class AdmissionProgramsService {
  constructor(
    @InjectModel(AdmissionProgram.name)
    private admissionProgramModel: Model<AdmissionProgramDocument>,
    private readonly admissionProgramsGateway: AdmissionProgramsGateway,
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
  ) {}

  async findAllDegreeLevels(
    queryAdmissionProgramDegreeLevelsDto: QueryAdmissionProgramDegreeLevelsDto,
  ): Promise<string[]> {
    const { university_id, campus_id } = queryAdmissionProgramDegreeLevelsDto;
    const pipeline: PipelineStage[] = [];

    // Stage 1: Optional: Filter by university_id and/or campus_id if provided
    if (university_id || campus_id) {
      // Lookup to admissions collection
      pipeline.push({
        $lookup: {
          from: 'admissions',
          let: { admissionIdStr: '$admission' }, // admission is a string ID in AdmissionProgram
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', { $toObjectId: '$$admissionIdStr' }] },
                    ...(university_id
                      ? [{ $eq: ['$university_id', String(university_id)] }]
                      : []),
                    ...(campus_id
                      ? [{ $eq: ['$campus_id', String(campus_id)] }]
                      : []),
                  ],
                },
              },
            },
          ],
          as: 'admissionDetails',
        },
      });
      // Filter out AdmissionPrograms that don't have matching admissionDetails (i.e., not for the given university/campus)
      pipeline.push({
        $match: {
          admissionDetails: { $ne: [] }, // or $size: { $gt: 0 }
        },
      });
    }

    // Stage 2: Lookup to programs collection
    // The 'program' field in AdmissionProgram is a string ID
    pipeline.push({
      $lookup: {
        from: 'programs',
        let: { programIdStr: '$program' },
        pipeline: [
          {
            // match the program_id in the admission_program with the program_id in the program collection
            // also match the docs where degree_level is not null or empty and also exists (not undefined)
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', { $toObjectId: '$$programIdStr' }] },
                  { $ne: [{ $ifNull: ['$degree_level', null] }, null] },
                  { $ne: [{ $ifNull: ['$degree_level', ''] }, ''] },
                ],
              },
            },
          },
          {
            $project: { degree_level: 1 }, // Only need degree_level from program (_id is also automatically added to the pipeline)
          },
        ],
        as: 'programDetails',
      },
    });

    // Stage 3: Unwind the programDetails array (should usually be one program per admission program)
    pipeline.push({
      $unwind: '$programDetails',
    });

    // Stage 4: Group by degree_level to get unique values
    pipeline.push({
      $group: {
        _id: '$programDetails.degree_level',
      },
    });

    // Stage 5: Project to reshape the output
    pipeline.push({
      $project: {
        _id: 0,
        degree_level: '$_id',
      },
    });

    const result = await this.admissionProgramModel.aggregate(pipeline).exec();
    return result.map((item) => item.degree_level);
  }

  async findAllMajors(
    queryAdmissionProgramMajorsDto: QueryAdmissionProgramMajorsDto,
  ): Promise<string[]> {
    const { university_id, campus_id } = queryAdmissionProgramMajorsDto;
    const pipeline: PipelineStage[] = [];

    // Stage 1: Optional: Filter by university_id and/or campus_id if provided
    if (university_id || campus_id) {
      // Lookup to admissions collection
      pipeline.push({
        $lookup: {
          from: 'admissions',
          let: { admissionIdStr: '$admission' }, // admission is a string ID in AdmissionProgram
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', { $toObjectId: '$$admissionIdStr' }] },
                    ...(university_id
                      ? [{ $eq: ['$university_id', String(university_id)] }]
                      : []),
                    ...(campus_id
                      ? [{ $eq: ['$campus_id', String(campus_id)] }]
                      : []),
                  ],
                },
              },
            },
          ],
          as: 'admissionDetails',
        },
      });
      // Filter out AdmissionPrograms that don't have matching admissionDetails (i.e., not for the given university/campus)
      pipeline.push({
        $match: {
          admissionDetails: { $ne: [] }, // or $size: { $gt: 0 }
        },
      });
    }

    // Stage 2: Lookup to programs collection
    // The 'program' field in AdmissionProgram is a string ID
    pipeline.push({
      $lookup: {
        from: 'programs',
        let: { programIdStr: '$program' },
        pipeline: [
          {
            // match the program_id in the admission_program with the program_id in the program collection
            // also match the docs where major is not null or empty and also exists (not undefined)
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', { $toObjectId: '$$programIdStr' }] },
                  { $ne: [{ $ifNull: ['$major', null] }, null] },
                  { $ne: [{ $ifNull: ['$major', ''] }, ''] },
                ],
              },
            },
          },
          {
            $project: { major: 1 }, // Only need major from program (_id is also automatically added to the pipeline)
          },
        ],
        as: 'programDetails',
      },
    });

    // Stage 3: Unwind the programDetails array (should usually be one program per admission program)
    pipeline.push({
      $unwind: '$programDetails',
    });

    // Stage 4: Group by major to get unique values
    pipeline.push({
      $group: {
        _id: '$programDetails.major',
      },
    });

    // Stage 5: Project to reshape the output
    pipeline.push({
      $project: {
        _id: 0,
        major: '$_id',
      },
    });

    const result = await this.admissionProgramModel.aggregate(pipeline).exec();
    return result.map((item) => item.major);
  }

  // REVIEW: Would it be better to put this in the `programService` directly or as a method of `searchHistoryAnalyticsService` itself?
  async indexAdmissionProgramSearchHistory(
    user_id: string,
    filterDto: FilterAdmissionProgramDto,
  ) {
    const {
      // degree_level, major, mode_of_study, name: program_name, university_id
      major,
      university,
      programName,
      campusId,
      studyLevel,
      // courseForm,
      // fee,
      // year,
      // intake,
    } = filterDto;

    const admissionProgramSearchHistory: ISearchHistoryIndexDoc = {
      user_id,
      user_type: UserNS.UserType.Student,
      resource_type: SearchResourceEnum.ADMISSION_PROGRAM,
      data: {
        major,
        program_name: programName,
        university_id: university,
        campus_id: campusId,
        degree_level: studyLevel,
        // mode_of_study: modeOfStudy,
        // program_id: programId,
        // university_name: universityName,
      },
    };

    // Track search event
    await this.searchHistoryAnalyticsService.indexSearchHistory(
      admissionProgramSearchHistory,
    );
  }

  async create(
    createAdmissionProgramDto: CreateAdmissionProgramDto,
    userId: string,
  ): Promise<AdmissionProgramDocument> {
    try {
      const createdAdmissionProgram = new this.admissionProgramModel({
        ...createAdmissionProgramDto,
        createdBy: userId,
        created_at: new Date(),
      });

      const savedProgram = await createdAdmissionProgram.save();
      this.admissionProgramsGateway.emitAdmissionProgramUpdate(savedProgram);
      return savedProgram;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QueryAdmissionProgramDto,
  ): Promise<{ data: AdmissionProgramDocument[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      admission,
      program,
      favouriteBy,
      minAvailableSeats,
      maxAvailableSeats,
      populate = true,
    } = queryDto;

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, SortOrder> = {
      [sortBy]: sortOrder as SortOrder,
    };

    // Build filter
    const filter: any = {};

    if (search) {
      // Search in relevant fields
      filter.$or = [
        { 'admission_requirements.key': { $regex: search, $options: 'i' } },
        { redirect_deeplink: { $regex: search, $options: 'i' } },
      ];
    }

    if (admission) {
      filter.admission = admission;
    }

    if (program) {
      filter.program = program;
    }

    if (favouriteBy && favouriteBy.length > 0) {
      filter.favouriteBy = { $in: favouriteBy };
    }

    if (minAvailableSeats !== undefined) {
      filter.available_seats = {
        ...filter.available_seats,
        $gte: minAvailableSeats,
      };
    }

    if (maxAvailableSeats !== undefined) {
      filter.available_seats = {
        ...filter.available_seats,
        $lte: maxAvailableSeats,
      };
    }

    // Execute query
    let query = this.admissionProgramModel.find(filter);

    // Apply population if requested
    if (populate) {
      query = query
        .populate('admission')
        .populate({
          path: 'program',
          populate: {
            path: 'campus_id',
            populate: [{ path: 'address_id' }, { path: 'university_id' }],
          },
        })
        .populate('createdBy');
    }

    // Get total count for pagination
    const total = await this.admissionProgramModel.countDocuments(filter);

    // Apply sorting and pagination
    const data = await query.sort(sortOptions).skip(skip).limit(limit).exec();

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

  async findOne(
    admission_program_id: string,
    user: AuthenticatedRequest['user'],
    queryDto: QueryAdmissionProgramByIdDto,
  ): Promise<AdmissionProgramDocument & { was_redirected?: boolean }> {
    // Validate the admission program ID, convert to ObjectId if valid
    const admission_program_id_object_id = Types.ObjectId.isValid(
      admission_program_id,
    )
      ? new Types.ObjectId(admission_program_id)
      : null;

    if (!admission_program_id_object_id) {
      throw new BadRequestException(
        `Invalid admission program ID; ${admission_program_id} is not a valid ObjectId`,
      );
    }

    // Build the query
    let query = this.admissionProgramModel
      .findById<AdmissionProgramDocument>(admission_program_id_object_id)
      .lean();

    // Apply population if requested
    if (queryDto.populate) {
      query = query.populate('admission').populate('program');
    }

    // Execute the query
    const admissionProgram = await query.exec();

    // Check if the admission program was found
    if (!admissionProgram) {
      throw new NotFoundException(
        `Admission program with ID ${admission_program_id} not found`,
      );
    }

    // Check if the user was redirected
    let was_redirected = false;

    if (user._id && admissionProgram.redirected_students) {
      const userObjectId = new Types.ObjectId(user._id);
      was_redirected = admissionProgram.redirected_students.some((studentId) =>
        studentId.equals(userObjectId),
      );
    }

    return {
      ...admissionProgram,
      was_redirected,
    };
  }

  async update(
    id: string,
    updateAdmissionProgramDto: UpdateAdmissionProgramDto,
  ): Promise<AdmissionProgramDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid admission program ID');
    }

    const updatedAdmissionProgram = await this.admissionProgramModel
      .findByIdAndUpdate(
        id,
        { ...updateAdmissionProgramDto, updatedAt: new Date() },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedAdmissionProgram) {
      throw new NotFoundException(`Admission program with ID ${id} not found`);
    }

    this.admissionProgramsGateway.emitAdmissionProgramUpdate(
      updatedAdmissionProgram,
    );
    return updatedAdmissionProgram;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid admission program ID');
    }

    const admissionProgram = await this.admissionProgramModel
      .findById(id)
      .exec();

    if (!admissionProgram) {
      throw new NotFoundException(`Admission program with ID ${id} not found`);
    }

    await this.admissionProgramModel.findByIdAndDelete(id).exec();

    this.admissionProgramsGateway.emitAdmissionProgramUpdate({
      _id: id,
      deleted: true,
      admission: admissionProgram.admission,
      program: admissionProgram.program,
    });

    return { deleted: true };
  }

  async addToFavorites(
    id: string,
    userId: string,
  ): Promise<AdmissionProgramDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid admission program ID');
    }

    const admissionProgram = await this.admissionProgramModel.findById(id);

    if (!admissionProgram) {
      throw new NotFoundException(`Admission program with ID ${id} not found`);
    }

    // Check if already in favorites
    if (!admissionProgram.favouriteBy) {
      admissionProgram.favouriteBy = [];
    }

    if (!admissionProgram.favouriteBy.includes(userId)) {
      admissionProgram.favouriteBy.push(userId);
      await admissionProgram.save();
    }

    return admissionProgram;
  }

  async removeFromFavorites(
    id: string,
    userId: string,
  ): Promise<AdmissionProgramDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid admission program ID');
    }

    const admissionProgram = await this.admissionProgramModel.findById(id);

    if (!admissionProgram) {
      throw new NotFoundException(`Admission program with ID ${id} not found`);
    }

    // Remove from favorites if exists
    if (
      admissionProgram.favouriteBy &&
      admissionProgram.favouriteBy.includes(userId)
    ) {
      admissionProgram.favouriteBy = admissionProgram.favouriteBy.filter(
        (id) => id !== userId,
      );
      await admissionProgram.save();
    }

    return admissionProgram;
  }

  async findFavorites(
    userId: string,
    queryDto: QueryAdmissionProgramDto,
  ): Promise<{ data: AdmissionProgramDocument[]; meta: any }> {
    // Add the user ID to the favorites filter
    return this.findAll({
      ...queryDto,
      favouriteBy: [userId],
    });
  }

  async findWithFilters(
    queryParams: any,
  ): Promise<{ docs: any[]; pagination: any }> {
    const {
      _id,
      major,
      fee,
      year,
      intake,
      programName,
      university,
      studyLevel,
      courseForm,
      campusId,
      page = 1,
      limit = 10,
    } = queryParams;
    console.log(queryParams);
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [];

    // Check if _id is present in query params for single record lookup
    if (_id) {
      pipeline.push({
        $match: {
          _id: new Types.ObjectId(_id.toString()),
        },
      });

      // Add lookups for a single record
      pipeline.push({
        $lookup: {
          from: 'admissions',
          let: { admissionId: '$admission' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', { $toObjectId: '$$admissionId' }] },
                    { $gt: [new Date(), '$admission_deadline'] },
                  ],
                },
              },
            },
          ],
          as: 'admission',
        },
      });

      pipeline.push({ $unwind: '$admission' });

      pipeline.push({
        $lookup: {
          from: 'programs',
          let: { programId: '$program' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$programId' }],
                },
              },
            },
            {
              $lookup: {
                from: 'academic_departments',
                let: { academicDepartmentId: '$academic_departments' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id',
                          { $toObjectId: '$$academicDepartmentId' },
                        ],
                      },
                    },
                  },
                ],
                as: 'academic_departments',
              },
            },
            {
              $unwind: {
                path: '$academic_departments',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: 'program',
        },
      });

      pipeline.push({ $unwind: '$program' });

      pipeline.push({
        $lookup: {
          from: 'fee_structures',
          let: { programId: '$program._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toObjectId: '$program_id' }, '$$programId'],
                },
              },
            },
          ],
          as: 'fee_structures',
        },
      });

      pipeline.push({ $sort: { 'program.sorting_weight': -1 } });

      const result = await this.admissionProgramModel.aggregate(pipeline);

      if (result.length > 0) {
        return { docs: [result[0]], pagination: null };
      } else {
        throw new NotFoundException('Record not found');
      }
    }

    // For multiple records with filtering
    pipeline.push({
      $lookup: {
        from: 'admissions',
        let: { admissionId: { $toObjectId: '$admission' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$admissionId'],
              },
            },
          },
          {
            $lookup: {
              from: 'universities',
              let: { universityId: { $toObjectId: '$university_id' } },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$universityId'],
                    },
                  },
                },
              ],
              as: 'university',
            },
          },
          {
            $unwind: { path: '$university', preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: 'campuses',
              let: { campusId: { $toObjectId: '$campus_id' } },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$campusId'],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'addresses',
                    let: { addressId: { $toObjectId: '$address_id' } },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $eq: ['$_id', '$$addressId'],
                          },
                        },
                      },
                    ],
                    as: 'address',
                  },
                },
                {
                  $unwind: {
                    path: '$address',
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              as: 'campus',
            },
          },
          { $unwind: { path: '$campus', preserveNullAndEmptyArrays: true } },
        ],
        as: 'admission',
      },
    });

    pipeline.push({ $unwind: '$admission' });

    pipeline.push({
      $lookup: {
        from: 'programs',
        let: { programId: '$program' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $toObjectId: '$$programId' }],
              },
            },
          },
          {
            $lookup: {
              from: 'academic_departments',
              let: { academicDepartmentId: '$academic_departments' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', { $toObjectId: '$$academicDepartmentId' }],
                    },
                  },
                },
              ],
              as: 'academic_departments',
            },
          },
          {
            $unwind: {
              path: '$academic_departments',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'program',
      },
    });

    pipeline.push({ $unwind: '$program' });

    pipeline.push({
      $lookup: {
        from: 'fee_structures',
        let: { programId: '$program._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toObjectId: '$program_id' }, '$$programId'],
              },
            },
          },
        ],
        as: 'fee_structures',
      },
    });

    // Apply filters
    if (major)
      pipeline.push({
        $match: { 'program.name': { $regex: major, $options: 'i' } },
      });
    if (programName)
      pipeline.push({
        $match: { 'program.name': { $regex: programName, $options: 'i' } },
      });
    if (university)
      pipeline.push({
        $match: { 'admission.university_id': { $eq: university } },
      });
    if (campusId)
      pipeline.push({ $match: { 'program.campus_id': { $eq: campusId } } });

    if (year) {
      pipeline.push({
        $match: {
          'admission.admission_startdate': {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year}-12-31`),
          },
        },
      });
    }

    if (intake)
      pipeline.push({
        $match: {
          'program.intake_periods.intake_period': {
            $regex: intake,
            $options: 'i',
          },
        },
      });
    if (studyLevel)
      pipeline.push({
        $match: {
          'program.degree_level': { $regex: studyLevel, $options: 'i' },
        },
      });
    if (courseForm)
      pipeline.push({
        $match: {
          'program.mode_of_study': { $regex: courseForm, $options: 'i' },
        },
      });

    if (fee) {
      const [minFee, maxFee] = (fee as string).split('-').map(Number);
      pipeline.push({
        $match: {
          'fee_structures.tuition_fee': { $gte: minFee, $lte: maxFee },
        },
      });
    }

    // Add sorting
    pipeline.push({ $sort: { 'program.sorting_weight': -1 } });

    // Pagination
    pipeline.push({
      $facet: {
        docs: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.admissionProgramModel.aggregate(pipeline);

    const docs = result[0]?.docs || [];
    const totalCount = result[0]?.totalCount?.[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    const pagination = {
      totalDocs: totalCount,
      limit: limitNum,
      totalPages,
      page: pageNum,
      pagingCounter: skip + 1,
      hasPrevPage: pageNum > 1,
      hasNextPage: pageNum < totalPages,
      prevPage: pageNum > 1 ? pageNum - 1 : null,
      nextPage: pageNum < totalPages ? pageNum + 1 : null,
    };

    return { docs, pagination };
  }
}
