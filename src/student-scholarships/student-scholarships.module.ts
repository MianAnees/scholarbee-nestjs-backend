import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { StudentScholarshipsController } from './controllers/student-scholarships.controller';
import { StudentScholarship, StudentScholarshipSchema } from './schemas/student-scholarship.schema';
import { StudentScholarshipsService } from './services/student-scholarships.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'student_scholarships', schema: StudentScholarshipSchema },
            { name: 'users', schema: UserSchema }
        ])
    ],
    controllers: [StudentScholarshipsController],
    providers: [StudentScholarshipsService],
    exports: [StudentScholarshipsService]
})
export class StudentScholarshipsModule { } 