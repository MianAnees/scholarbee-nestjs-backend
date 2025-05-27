import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  RootFilterQuery,
  Types,
  Schema as MongooseSchema,
} from 'mongoose';
import {
  Scholarship,
  ScholarshipDocument,
} from '../schemas/scholarship.schema';
import { CreateScholarshipDto } from '../dto/create-scholarship.dto';
import { QueryScholarshipDto } from '../dto/query-scholarship.dto';

@Injectable()
export class ScholarshipsService {
  constructor(
    @InjectModel(Scholarship.name)
    private scholarshipModel: Model<ScholarshipDocument>,
  ) {}

  async create(
    createScholarshipDto: CreateScholarshipDto,
    userId: string,
  ): Promise<ScholarshipDocument> {
    try {
      const scholarship = new this.scholarshipModel({
        ...createScholarshipDto,
        createdBy: userId,
      });
      return await scholarship.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QueryScholarshipDto,
  ): Promise<{ data: ScholarshipDocument[]; meta: any }> {
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
      favouriteBy,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      populate = true,
      degree_level,
      location,
      campus_id,
      major,
      start_date,
      end_date,
      rating,
    } = queryDto;

    const filter: RootFilterQuery<ScholarshipDocument> = {};

    if (search) {
      filter.$or = [
        { scholarship_name: { $regex: search, $options: 'i' } },
        { scholarship_description: { $regex: search, $options: 'i' } },
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

    // `is_favourite` flag can be used to get the favorites of the requesting user. However, the endpoint is public and the requesting user might not be authenticated
    if (favouriteBy && favouriteBy.length > 0) {
      filter.favouriteBy = {
        $in: favouriteBy.map((id) => new Types.ObjectId(id)),
      };
    }

    if (degree_level) {
      filter.degree_level = degree_level;
    }

    if (location) {
      filter.location = location;
    }

    if (campus_id) {
      filter.campus_ids = { $in: [new Types.ObjectId(campus_id)] };
    }

    if (major) {
      filter.major = { $regex: major, $options: 'i' };
    }

    if (rating) {
      filter.rating = { $gte: rating };
    }

    if (start_date || end_date) {
      filter.application_opening_date = {};
      if (start_date) {
        filter.application_opening_date.$gte = start_date;
      }
      if (end_date) {
        filter.application_opening_date.$lte = end_date;
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
        .populate('region')
        .populate('organization_id');
    }

    const [scholarships, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).exec(),
      this.scholarshipModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: scholarships,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
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

  async update(
    id: string,
    updateScholarshipDto: Partial<CreateScholarshipDto>,
  ): Promise<ScholarshipDocument> {
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

  /**
   * Add a scholarship to the user's favorites
   * Flow:
   * - Check if the scholarship exists
   * @param scholarshipId - The ID of the scholarship
   * @param userId - The ID of the user
   * @returns The updated scholarship
   */
  async addToFavorites(
    scholarshipId: string,
    userId: string,
  ): Promise<ScholarshipDocument> {
    if (!Types.ObjectId.isValid(scholarshipId)) {
      throw new BadRequestException('Invalid scholarship ID');
    }
    const userIdObject = new MongooseSchema.Types.ObjectId(userId);
    const scholarship = await this.scholarshipModel.findById(scholarshipId);
    if (!scholarship) {
      throw new NotFoundException(
        `Scholarship with ID ${scholarshipId} not found`,
      );
    }
    if (!scholarship.favouriteBy) {
      scholarship.favouriteBy = [];
    }
    if (!scholarship.favouriteBy.includes(userIdObject)) {
      scholarship.favouriteBy.push(userIdObject);
      await scholarship.save();
    }
    return scholarship;
  }

  async removeFromFavorites(
    id: string,
    userId: string,
  ): Promise<ScholarshipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid scholarship ID');
    }
    const userIdObject = new MongooseSchema.Types.ObjectId(userId);

    const scholarship = await this.scholarshipModel.findById(id);
    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }
    if (
      scholarship.favouriteBy &&
      scholarship.favouriteBy.includes(userIdObject)
    ) {
      scholarship.favouriteBy = scholarship.favouriteBy.filter(
        (uid) => uid !== userIdObject,
      );
      await scholarship.save();
    }
    return scholarship;
  }

  async findFavorites(
    userId: string,
    queryDto: QueryScholarshipDto,
  ): Promise<{ data: ScholarshipDocument[]; meta: any }> {
    return this.findAll({
      ...queryDto,
      favouriteBy: [userId],
    });
  }
} 