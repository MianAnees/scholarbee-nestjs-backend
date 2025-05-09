import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Contact, ContactDocument } from '../schemas/contact.schema';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { QueryContactDto } from '../dto/query-contact.dto';
import { ContactGateway } from '../gateways/contact.gateway';

@Injectable()
export class ContactService {
    constructor(
        @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
        private readonly contactGateway: ContactGateway
    ) { }

    async create(createContactDto: CreateContactDto): Promise<ContactDocument> {
        try {
            const createdContact = new this.contactModel({
                ...createContactDto,
                created_at: new Date(),
            });

            const savedContact = await createdContact.save();
            this.contactGateway.emitContactUpdate(savedContact);
            return savedContact;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryContactDto): Promise<{ data: ContactDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            email,
            phone,
            type,
            is_scholarship,
            study_level,
            study_country,
            study_city,
            campusesIds,
            user_type,
            createdAtFrom,
            createdAtTo,
            populate = true
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder as SortOrder };

        // Build filter
        const filter: any = {};

        if (search) {
            // Search in relevant fields
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
                { study_city: { $regex: search, $options: 'i' } },
                { study_country: { $regex: search, $options: 'i' } }
            ];
        }

        if (email) {
            filter.email = { $regex: email, $options: 'i' };
        }

        if (phone) {
            filter.phone = { $regex: phone, $options: 'i' };
        }

        if (type) {
            filter.type = type;
        }

        if (is_scholarship !== undefined) {
            filter.is_scholarship = is_scholarship;
        }

        if (study_level) {
            filter.study_level = { $regex: study_level, $options: 'i' };
        }

        if (study_country) {
            filter.study_country = { $regex: study_country, $options: 'i' };
        }

        if (study_city) {
            filter.study_city = { $regex: study_city, $options: 'i' };
        }

        if (campusesIds && campusesIds.length > 0) {
            filter.campusesIds = { $in: campusesIds };
        }

        if (user_type) {
            filter.user_type = user_type;
        }

        // Date range filters
        if (createdAtFrom || createdAtTo) {
            filter.createdAt = {};
            if (createdAtFrom) {
                filter.createdAt.$gte = new Date(createdAtFrom);
            }
            if (createdAtTo) {
                filter.createdAt.$lte = new Date(createdAtTo);
            }
        }

        try {
            const query = this.contactModel.find(filter);

            // Add population if requested
            if (populate) {
                query.populate('campusesIds');
            }

            const [data, total] = await Promise.all([
                query.sort(sortOptions).skip(skip).limit(limit).exec(),
                this.contactModel.countDocuments(filter)
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
            throw new BadRequestException(`Error fetching contacts: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<ContactDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid contact ID');
        }

        const contact = await this.contactModel.findById(id).populate('campusesIds').exec();

        if (!contact) {
            throw new NotFoundException(`Contact with ID ${id} not found`);
        }

        return contact;
    }

    async update(id: string, updateContactDto: UpdateContactDto): Promise<ContactDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid contact ID');
        }

        const updatedContact = await this.contactModel.findByIdAndUpdate(
            id,
            { ...updateContactDto, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).exec();

        if (!updatedContact) {
            throw new NotFoundException(`Contact with ID ${id} not found`);
        }

        this.contactGateway.emitContactUpdate(updatedContact);
        return updatedContact;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid contact ID');
        }

        const contact = await this.contactModel.findById(id).exec();

        if (!contact) {
            throw new NotFoundException(`Contact with ID ${id} not found`);
        }

        await this.contactModel.findByIdAndDelete(id).exec();

        this.contactGateway.emitContactUpdate({
            _id: id,
            deleted: true
        });

        return { deleted: true };
    }

    async getStatistics(): Promise<any> {
        const stats = await Promise.all([
            this.contactModel.countDocuments(),
            this.contactModel.countDocuments({ is_scholarship: true }),
            this.contactModel.countDocuments({ type: 'registration' }),
            this.contactModel.countDocuments({ type: 'general' }),
            this.contactModel.aggregate([
                {
                    $group: {
                        _id: '$study_level',
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        _id: { $ne: null }
                    }
                }
            ]),
            this.contactModel.aggregate([
                {
                    $group: {
                        _id: '$study_city',
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
            scholarshipRequests: stats[1],
            registrationInquiries: stats[2],
            generalInquiries: stats[3],
            byStudyLevel: stats[4].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byCity: stats[5].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }
} 