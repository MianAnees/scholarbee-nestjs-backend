import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressesService {
    constructor(
        @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    ) { }

    async create(createAddressDto: CreateAddressDto, userId: string) {
        const newAddress = new this.addressModel({
            ...createAddressDto,
            createdBy: Types.ObjectId.createFromHexString(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return await newAddress.save();
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        sortBy: string = 'createdAt',
        order: SortOrder = 'desc',
    ) {
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: order };

        const [data, total] = await Promise.all([
            this.addressModel.find().sort(sort).skip(skip).limit(limit).exec(),
            this.addressModel.countDocuments(),
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
    }

    async findOne(id: string) {
        return await this.addressModel.findById(id);
    }

    async update(id: string, updateAddressDto: UpdateAddressDto) {
        return await this.addressModel.findByIdAndUpdate(
            id,
            {
                ...updateAddressDto,
                updatedAt: new Date(),
            },
            { new: true },
        );
    }

    async remove(id: string) {
        return await this.addressModel.findByIdAndDelete(id);
    }
} 