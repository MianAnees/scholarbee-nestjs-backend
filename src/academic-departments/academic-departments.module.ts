import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicDepartmentsController } from './academic-departments.controller';
import { AcademicDepartmentsService } from './academic-departments.service';
import { AcademicDepartment, AcademicDepartmentSchema } from './schemas/academic-department.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AcademicDepartment.name, schema: AcademicDepartmentSchema },
        ]),
    ],
    controllers: [AcademicDepartmentsController],
    providers: [AcademicDepartmentsService],
    exports: [AcademicDepartmentsService],
})
export class AcademicDepartmentsModule { } 