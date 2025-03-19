import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { ProgramTemplate, ProgramTemplateDocument } from '../schemas/program-template.schema';
import { CreateProgramTemplateDto } from '../dto/create-program-template.dto';
import { UpdateProgramTemplateDto } from '../dto/update-program-template.dto';
import { QueryProgramTemplateDto } from '../dto/query-program-template.dto';
import slugify from 'slugify';

@Injectable()
export class ProgramTemplatesService {
    constructor(
        @InjectModel(ProgramTemplate.name) private programTemplateModel: Model<ProgramTemplateDocument>
    ) { }

    async create(createProgramTemplateDto: CreateProgramTemplateDto): Promise<ProgramTemplateDocument> {
        try {
            // Generate slug if not provided
            if (!createProgramTemplateDto.slug) {
                createProgramTemplateDto.slug = slugify(createProgramTemplateDto.name, {
                    lower: true,
                    strict: true,
                    replacement: '-'
                });
            }

            // Check if slug already exists
            const existingTemplate = await this.programTemplateModel.findOne({
                slug: createProgramTemplateDto.slug
            }).exec();

            if (existingTemplate) {
                throw new ConflictException(`Program template with slug '${createProgramTemplateDto.slug}' already exists`);
            }

            const createdTemplate = new this.programTemplateModel({
                ...createProgramTemplateDto,
                created_at: new Date(),
                updated_at: new Date()
            });

            return await createdTemplate.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Program template with this slug already exists');
            }
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryProgramTemplateDto): Promise<{ data: ProgramTemplateDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            name,
            slug,
            group,
            tag,
            createdBy,
            createdAtFrom,
            createdAtTo
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder as SortOrder };

        // Build filter
        const filter: any = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { group: { $regex: search, $options: 'i' } }
            ];
        }

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (slug) {
            filter.slug = { $regex: slug, $options: 'i' };
        }

        if (group) {
            filter.group = { $regex: group, $options: 'i' };
        }

        if (tag) {
            filter['tags.tag'] = { $regex: tag, $options: 'i' };
        }

        if (createdBy) {
            filter.createdBy = createdBy;
        }

        if (createdAtFrom || createdAtTo) {
            filter.created_at = {};
            if (createdAtFrom) {
                filter.created_at.$gte = createdAtFrom;
            }
            if (createdAtTo) {
                filter.created_at.$lte = createdAtTo;
            }
        }

        try {
            const [data, total] = await Promise.all([
                this.programTemplateModel.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.programTemplateModel.countDocuments(filter)
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
            throw new BadRequestException(`Error fetching program templates: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<ProgramTemplateDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program template ID');
        }

        const template = await this.programTemplateModel.findById(id).exec();

        if (!template) {
            throw new NotFoundException(`Program template with ID ${id} not found`);
        }

        return template;
    }

    async findBySlug(slug: string): Promise<ProgramTemplateDocument> {
        const template = await this.programTemplateModel.findOne({ slug }).exec();

        if (!template) {
            throw new NotFoundException(`Program template with slug ${slug} not found`);
        }

        return template;
    }

    async update(id: string, updateProgramTemplateDto: UpdateProgramTemplateDto): Promise<ProgramTemplateDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program template ID');
        }

        try {
            // If slug is being updated, generate it from name if not provided
            if (updateProgramTemplateDto.name && !updateProgramTemplateDto.slug) {
                updateProgramTemplateDto.slug = slugify(updateProgramTemplateDto.name, {
                    lower: true,
                    strict: true,
                    replacement: '-'
                });
            }

            // Check if new slug already exists (but not for this template)
            if (updateProgramTemplateDto.slug) {
                const existingTemplate = await this.programTemplateModel.findOne({
                    slug: updateProgramTemplateDto.slug,
                    _id: { $ne: id }
                }).exec();

                if (existingTemplate) {
                    throw new ConflictException(`Program template with slug '${updateProgramTemplateDto.slug}' already exists`);
                }
            }

            const updatedTemplate = await this.programTemplateModel.findByIdAndUpdate(
                id,
                {
                    ...updateProgramTemplateDto,
                    updated_at: new Date()
                },
                { new: true, runValidators: true }
            ).exec();

            if (!updatedTemplate) {
                throw new NotFoundException(`Program template with ID ${id} not found`);
            }

            return updatedTemplate;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Program template with this slug already exists');
            }
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid program template ID');
        }

        const result = await this.programTemplateModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Program template with ID ${id} not found`);
        }

        return { deleted: true };
    }

    async getStatistics(): Promise<any> {
        const stats = await Promise.all([
            this.programTemplateModel.countDocuments(),
            this.programTemplateModel.aggregate([
                {
                    $group: {
                        _id: '$group',
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        _id: { $ne: null }
                    }
                }
            ]),
            this.programTemplateModel.aggregate([
                { $unwind: '$tags' },
                {
                    $group: {
                        _id: '$tags.tag',
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
            byGroup: stats[1].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            topTags: stats[2].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }
} 