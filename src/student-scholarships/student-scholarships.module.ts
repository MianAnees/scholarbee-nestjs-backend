import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { StudentScholarshipsController } from './controllers/student-scholarships.controller';
import { StudentScholarship, StudentScholarshipSchema } from './schemas/student-scholarship.schema';
import { StudentScholarshipsService } from './services/student-scholarships.service';
import { Scholarship, ScholarshipSchema } from 'src/scholarships/schemas/scholarship.schema';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: StudentScholarship.name, schema: StudentScholarshipSchema },
            { name: User.name, schema: UserSchema },
            { name: Scholarship.name, schema: ScholarshipSchema },
        ])
    ],
    controllers: [StudentScholarshipsController],
    providers: [StudentScholarshipsService],
    exports: [StudentScholarshipsService]
})
export class StudentScholarshipsModule { } 