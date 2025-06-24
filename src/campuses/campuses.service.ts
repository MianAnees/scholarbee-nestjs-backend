import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  SortOrder,
  Types,
  PipelineStage,
  RootFilterQuery,
} from 'mongoose';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { QueryCampusDto } from './dto/query-campus.dto';
import { Campus, CampusDocument } from './schemas/campus.schema';
import { AdmissionStatusEnum } from '../admissions/schemas/admission.schema';
import { getDataAndCountAggPipeline, getSortOrder } from '../utils/db.utils';
import { User, UserDocument, UserNS } from '../users/schemas/user.schema';

@Injectable()
export class CampusesService {
  constructor(
    @InjectModel(Campus.name)
    private campusModel: Model<CampusDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private buildAdmissionStatusAggStages(
    admission_program_status: AdmissionStatusEnum,
  ): PipelineStage[] {
    const associatedAdmissionsLookupStage = {
      $lookup: {
        from: 'admissions', // The name of the admissions collection
        let: { campusIdStr: { $toString: '$_id' } }, // Convert ObjectId to string
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$campus_id', '$$campusIdStr'],
              },
            },
          },
        ],
        as: '__associated_admissions', // Output array field
      },
    };

    if (admission_program_status === AdmissionStatusEnum.UNAVAILABLE) {
      return [
        associatedAdmissionsLookupStage,
        {
          $match: {
            __associated_admissions: { $size: 0 }, // Filter out campuses that have no admissions
          },
        },
      ];
    } else if (admission_program_status === AdmissionStatusEnum.AVAILABLE) {
      return [
        associatedAdmissionsLookupStage,
        {
          $match: {
            __associated_admissions: { $not: { $size: 0 } }, // Filter for campuses that have at least one admission
          },
        },
      ];
    }
    return []; // Should not happen if called correctly, or handle default
  }

  private getAddressPopulationAggStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'addresses',
          let: { addressObjectId: { $toObjectId: '$address_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$addressObjectId'],
                },
              },
            },
          ],
          as: 'address_id',
        },
      },
      {
        $unwind: {
          path: '$address_id',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  private getUniversityPopulationAggStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'universities',
          let: { universityObjectId: { $toObjectId: '$university_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$universityObjectId'],
                },
              },
            },
          ],
          as: 'university_id',
        },
      },
      {
        $unwind: {
          path: '$university_id',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  async findAll(
    queryDto: QueryCampusDto,
    overrideFilter: RootFilterQuery<CampusDocument> = {},
  ) {
    const {
      page,
      limit,
      sortOrder,
      sortBy,
      name: nameSearch,
      admission_program_status,
    } = queryDto;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: getSortOrder(sortOrder) } as const;

    const filterPipeline: PipelineStage[] = [];

    // Conditionally add admission status stages
    if (admission_program_status) {
      filterPipeline.push(
        ...this.buildAdmissionStatusAggStages(admission_program_status),
      );
    }

    // Add name search filter if present
    if (nameSearch) {
      filterPipeline.push({
        $match: { name: { $regex: nameSearch, $options: 'i' } },
      });
    }

    // Add any other overrideFilter conditions
    const remainingOverrideFilter = { ...overrideFilter } as any;
    if (remainingOverrideFilter.name) delete remainingOverrideFilter.name;
    if (Object.keys(remainingOverrideFilter).length > 0) {
      filterPipeline.push({ $match: remainingOverrideFilter });
    }

    // Always add address and university population stages
    filterPipeline.push(...this.getAddressPopulationAggStages());
    filterPipeline.push(...this.getUniversityPopulationAggStages());

    // Remove temp fields
    filterPipeline.push({ $project: { __associated_admissions: 0 } });

    // Data and count pipelines
    const { dataPipeline, countPipeline } = getDataAndCountAggPipeline(
      filterPipeline,
      sort,
      limit,
      skip,
    );

    const [data, countDocArr] = await Promise.all([
      this.campusModel.aggregate(dataPipeline).exec(),
      this.campusModel.aggregate(countPipeline).exec(),
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

  async create(createCampusDto: CreateCampusDto, userId: string) {
    const newCampus = new this.campusModel({
      ...createCampusDto,
      university_id: createCampusDto.university_id
        ? Types.ObjectId.createFromHexString(createCampusDto.university_id)
        : undefined,
      address_id: createCampusDto.address_id
        ? Types.ObjectId.createFromHexString(createCampusDto.address_id)
        : undefined,
      createdBy: Types.ObjectId.createFromHexString(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await newCampus.save();
  }

  async findOne(id: string) {
    return await this.campusModel
      .findById(id)
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
      updateData.university_id = Types.ObjectId.createFromHexString(
        updateData.university_id,
      );
    }

    if (updateData.address_id) {
      updateData.address_id = Types.ObjectId.createFromHexString(
        updateData.address_id,
      );
    }

    return await this.campusModel.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async remove(id: string) {
    return await this.campusModel.findByIdAndDelete(id);
  }

  /**
   * Checks if a campus has any valid admins.
   * @param campusId - The campus ID as a string
   * @returns Promise<boolean> - true if at least one admin exists, false otherwise
   */
  async hasValidAdmins(campusId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(campusId)) {
      // throw error
      throw new BadRequestException('Invalid campus ID');
    }
    const count = await this.userModel.countDocuments({
      campus_id: campusId,
      user_type: UserNS.UserType.Campus_Admin,
    });
    return count > 0;
  }
}
