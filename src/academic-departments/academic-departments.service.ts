import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { CreateAcademicDepartmentDto } from './dto/create-academic-department.dto';
import { UpdateAcademicDepartmentDto } from './dto/update-academic-department.dto';

@Injectable()
export class AcademicDepartmentsService {
    constructor(
        @InjectModel('AcademicDepartment') private readonly academicDepartmentModel: Model<any>,
    ) { }

    async create(createAcademicDepartmentDto: CreateAcademicDepartmentDto, userId: string) {
        const newDepartment = new this.academicDepartmentModel({
            ...createAcademicDepartmentDto,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return await newDepartment.save();
    }

    async findAll(query: any) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', ...filters } = query;

        const skip = (page - 1) * limit;
        const sortOptions: { [key: string]: SortOrder } = { [sort]: order === 'desc' ? -1 : 1 };

        const departments = await this.academicDepartmentModel
            .find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await this.academicDepartmentModel.countDocuments(filters);

        return {
            data: departments,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        return await this.academicDepartmentModel.findById(id);
    }

    async update(id: string, updateAcademicDepartmentDto: UpdateAcademicDepartmentDto) {
        return await this.academicDepartmentModel.findByIdAndUpdate(
            id,
            {
                ...updateAcademicDepartmentDto,
                updatedAt: new Date(),
            },
            { new: true }
        );
    }

    async remove(id: string) {
        return await this.academicDepartmentModel.findByIdAndDelete(id);
    }
} 