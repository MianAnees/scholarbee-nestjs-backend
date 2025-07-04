import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Fee, FeeDocument } from '../schemas/fee.schema';
import { CreateFeeDto } from '../dto/create-fee.dto';
import { UpdateFeeDto } from '../dto/update-fee.dto';
import { QueryFeeDto } from '../dto/query-fee.dto';

@Injectable()
export class FeesService {
    constructor(
        @InjectModel(Fee.name) private feeModel: Model<FeeDocument>
    ) { }

    async create(createFeeDto: CreateFeeDto): Promise<FeeDocument> {
        try {
            const createdFee = new this.feeModel({
                ...createFeeDto,
                created_at: new Date(),
            });

            return await createdFee.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryFeeDto): Promise<{ data: FeeDocument[], meta: any }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            program_id,
            minTuitionFee,
            maxTuitionFee,
            minApplicationFee,
            maxApplicationFee,
            payment_schedule,
            createdAtFrom,
            createdAtTo,
            search
        } = queryDto;

        const skip = (page - 1) * limit;
        const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder as SortOrder };

        // Build filter
        const filter: any = {};

        if (program_id) {
            filter.program_id = program_id;
        }

        if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
            filter.tuition_fee = {};
            if (minTuitionFee !== undefined) {
                filter.tuition_fee.$gte = minTuitionFee;
            }
            if (maxTuitionFee !== undefined) {
                filter.tuition_fee.$lte = maxTuitionFee;
            }
        }

        if (minApplicationFee !== undefined || maxApplicationFee !== undefined) {
            filter.application_fee = {};
            if (minApplicationFee !== undefined) {
                filter.application_fee.$gte = minApplicationFee;
            }
            if (maxApplicationFee !== undefined) {
                filter.application_fee.$lte = maxApplicationFee;
            }
        }

        if (payment_schedule) {
            filter.payment_schedule = { $regex: payment_schedule, $options: 'i' };
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

        if (search) {
            filter.$or = [
                { payment_schedule: { $regex: search, $options: 'i' } },
                { other_fees: { $regex: search, $options: 'i' } },
                { program_id: { $regex: search, $options: 'i' } }
            ];
        }

        try {
            const [data, total] = await Promise.all([
                this.feeModel
                    .find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.feeModel.countDocuments(filter)
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
            throw new BadRequestException(`Error fetching fees: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<FeeDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid fee ID');
        }

        const fee = await this.feeModel.findById(id).exec();

        if (!fee) {
            throw new NotFoundException(`Fee with ID ${id} not found`);
        }

        return fee;
    }

    async findByProgramId(programId: string): Promise<FeeDocument[]> {
        return this.feeModel.find({ program_id: programId }).exec();
    }

    async update(id: string, updateFeeDto: UpdateFeeDto): Promise<FeeDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid fee ID');
        }

        const updatedFee = await this.feeModel.findByIdAndUpdate(
            id,
            { $set: updateFeeDto },
            { new: true }
        ).exec();

        if (!updatedFee) {
            throw new NotFoundException(`Fee with ID ${id} not found`);
        }

        return updatedFee;
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid fee ID');
        }

        const fee = await this.feeModel.findById(id).exec();

        if (!fee) {
            throw new NotFoundException(`Fee with ID ${id} not found`);
        }

        await this.feeModel.findByIdAndDelete(id).exec();

        return { deleted: true };
    }

    async getStatistics(): Promise<any> {
        const stats = await Promise.all([
            this.feeModel.countDocuments(),
            this.feeModel.aggregate([
                {
                    $group: {
                        _id: null,
                        avgTuitionFee: { $avg: '$tuition_fee' },
                        minTuitionFee: { $min: '$tuition_fee' },
                        maxTuitionFee: { $max: '$tuition_fee' },
                        avgApplicationFee: { $avg: '$application_fee' },
                        minApplicationFee: { $min: '$application_fee' },
                        maxApplicationFee: { $max: '$application_fee' }
                    }
                }
            ]),
            this.feeModel.aggregate([
                {
                    $group: {
                        _id: '$payment_schedule',
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
            feeStats: stats[1][0] || {
                avgTuitionFee: 0,
                minTuitionFee: 0,
                maxTuitionFee: 0,
                avgApplicationFee: 0,
                minApplicationFee: 0,
                maxApplicationFee: 0
            },
            byPaymentSchedule: stats[2].reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        };
    }
} 