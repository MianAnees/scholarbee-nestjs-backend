import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Region, RegionDocument } from '../schemas/region.schema';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';
import { QueryRegionDto } from '../dto/query-region.dto';

@Injectable()
export class RegionsService {
    constructor(
        @InjectModel(Region.name) private regionModel: Model<RegionDocument>
    ) { }

    async create(createRegionDto: CreateRegionDto): Promise<RegionDocument> {
        try {
            const createdRegion = new this.regionModel(createRegionDto);
            return await createdRegion.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryRegionDto): Promise<{ data: RegionDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            region_name,
            country,
            city,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: { [key: string]: SortOrder } = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const filter: any = {};

        if (region_name) {
            filter.region_name = { $regex: new RegExp(region_name, 'i') };
        }

        if (country) {
            filter.country = country;
        }

        if (city) {
            filter.cities = { $in: [new RegExp(city, 'i')] };
        }

        if (search) {
            filter.$or = [
                { region_name: { $regex: new RegExp(search, 'i') } },
                { cities: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const [data, total] = await Promise.all([
            this.regionModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.regionModel.countDocuments(filter).exec()
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        };

        return { data, meta };
    }

    async findOne(id: string): Promise<RegionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid region ID');
        }

        const region = await this.regionModel.findById(id).exec();

        if (!region) {
            throw new NotFoundException(`Region with ID ${id} not found`);
        }

        return region;
    }

    async update(id: string, updateRegionDto: UpdateRegionDto): Promise<RegionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid region ID');
        }

        const updatedRegion = await this.regionModel
            .findByIdAndUpdate(id, updateRegionDto, { new: true })
            .exec();

        if (!updatedRegion) {
            throw new NotFoundException(`Region with ID ${id} not found`);
        }

        return updatedRegion;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid region ID');
        }

        const result = await this.regionModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Region with ID ${id} not found`);
        }

        return { deleted: true };
    }

    async getStatistics(): Promise<any> {
        const stats = await Promise.all([
            this.regionModel.countDocuments(),
            this.regionModel.aggregate([
                {
                    $group: {
                        _id: '$country',
                        count: { $sum: 1 }
                    }
                }
            ]),
            this.regionModel.aggregate([
                { $unwind: '$cities' },
                {
                    $group: {
                        _id: '$cities',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                }
            ])
        ]);

        return {
            total: stats[0],
            byCountry: stats[1].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            topCities: stats[2].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }

    async addCity(id: string, city: string): Promise<RegionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid region ID');
        }

        const region = await this.regionModel.findById(id).exec();

        if (!region) {
            throw new NotFoundException(`Region with ID ${id} not found`);
        }

        if (!region.cities.includes(city)) {
            region.cities.push(city);
            return await region.save();
        }

        return region;
    }

    async removeCity(id: string, city: string): Promise<RegionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid region ID');
        }

        const region = await this.regionModel.findById(id).exec();

        if (!region) {
            throw new NotFoundException(`Region with ID ${id} not found`);
        }

        region.cities = region.cities.filter(c => c !== city);
        return await region.save();
    }
} 