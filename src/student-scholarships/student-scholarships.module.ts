import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentScholarshipsController } from './controllers/student-scholarships.controller';
import { StudentScholarshipsService } from './services/student-scholarships.service';
import { StudentScholarship, StudentScholarshipSchema } from './schemas/student-scholarship.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'student_scholarships', schema: StudentScholarshipSchema }
        ])
    ],
    controllers: [StudentScholarshipsController],
    providers: [StudentScholarshipsService],
    exports: [StudentScholarshipsService]
})
export class StudentScholarshipsModule { } 