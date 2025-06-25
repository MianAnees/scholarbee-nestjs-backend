import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { QueryOrganizationDto } from '../dto/query-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>
    ) { }

    async create(createOrganizationDto: CreateOrganizationDto): Promise<OrganizationDocument> {
        try {
            const createdOrganization = new this.organizationModel(createOrganizationDto);
            return await createdOrganization.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryOrganizationDto): Promise<{ data: OrganizationDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            organization_name,
            organization_type,
            address,
            contact_email,
            contact_phone,
            website_url,
            country,
            region,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder as SortOrder };

        // Build filter
        const filter: any = {};

        if (search) {
            filter.$or = [
                { organization_name: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { contact_email: { $regex: search, $options: 'i' } },
                { contact_phone: { $regex: search, $options: 'i' } },
                { website_url: { $regex: search, $options: 'i' } }
            ];
        }

        if (organization_name) {
            filter.organization_name = { $regex: organization_name, $options: 'i' };
        }

        if (organization_type) {
            filter.organization_type = organization_type;
        }

        if (address) {
            filter.address = { $regex: address, $options: 'i' };
        }

        if (contact_email) {
            filter.contact_email = { $regex: contact_email, $options: 'i' };
        }

        if (contact_phone) {
            filter.contact_phone = { $regex: contact_phone, $options: 'i' };
        }

        if (website_url) {
            filter.website_url = { $regex: website_url, $options: 'i' };
        }

        if (country) {
            filter.country = new Types.ObjectId(country);
        }

        if (region) {
            filter.region = new Types.ObjectId(region);
        }

        try {
            const query = this.organizationModel.find(filter);

            // Add population if requested
            if (populate) {
                query.populate('country').populate('region');
            }

            const [data, total] = await Promise.all([
                query.sort(sortOptions).skip(skip).limit(limit).exec(),
                this.organizationModel.countDocuments(filter)
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
        } catch (error) {
            throw new BadRequestException(`Error fetching organizations: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<OrganizationDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid organization ID');
        }

        const organization = await this.organizationModel.findById(id)
            .populate('country')
            .populate('region')
            .exec();

        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return organization;
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<OrganizationDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid organization ID');
        }

        try {
            const updatedOrganization = await this.organizationModel.findByIdAndUpdate(
                id,
                updateOrganizationDto,
                { new: true, runValidators: true }
            )
                .populate('country')
                .populate('region')
                .exec();

            if (!updatedOrganization) {
                throw new NotFoundException(`Organization with ID ${id} not found`);
            }

            return updatedOrganization;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid organization ID');
        }

        const result = await this.organizationModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return { deleted: true };
    }

    async getStatistics(): Promise<any> {
        const stats = await Promise.all([
            this.organizationModel.countDocuments(),
            this.organizationModel.aggregate([
                {
                    $group: {
                        _id: '$organization_type',
                        count: { $sum: 1 }
                    }
                }
            ]),
            this.organizationModel.aggregate([
                {
                    $group: {
                        _id: '$country',
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        _id: { $ne: null }
                    }
                }
            ]),
            this.organizationModel.aggregate([
                {
                    $group: {
                        _id: '$region',
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        _id: { $ne: null }
                    }
                }
            ])
        ]);

        return {
            total: stats[0],
            byOrganizationType: stats[1].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byCountry: stats[2].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byRegion: stats[3].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }
} 