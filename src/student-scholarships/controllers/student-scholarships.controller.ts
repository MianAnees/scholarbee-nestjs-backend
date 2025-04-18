import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { StudentScholarshipsService } from '../services/student-scholarships.service';
import { CreateStudentScholarshipDto } from '../dto/create-student-scholarship.dto';
import { UpdateStudentScholarshipDto } from '../dto/update-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('student-scholarships')
export class StudentScholarshipsController {
    constructor(private readonly studentScholarshipsService: StudentScholarshipsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createStudentScholarshipDto: CreateStudentScholarshipDto) {
        return this.studentScholarshipsService.create(createStudentScholarshipDto);
    }

    @Get()
    findAll(@Query() queryDto: QueryStudentScholarshipDto) {
        return this.studentScholarshipsService.findAll(queryDto);
    }

    @Get('statistics')
    getStatistics() {
        return this.studentScholarshipsService.getStatistics();
    }

    @Get('university/:universityId')
    findByUniversity(
        @Param('universityId') universityId: string,
        @Query() queryDto: QueryStudentScholarshipDto
    ) {
        return this.studentScholarshipsService.findByUniversity(universityId, queryDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.studentScholarshipsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateStudentScholarshipDto: UpdateStudentScholarshipDto
    ) {
        return this.studentScholarshipsService.update(id, updateStudentScholarshipDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.studentScholarshipsService.remove(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post(':id/documents')
    addRequiredDocument(
        @Param('id') id: string,
        @Body() document: { id: string; document_name: string }
    ) {
        return this.studentScholarshipsService.addRequiredDocument(id, document);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id/documents/:documentId')
    removeRequiredDocument(
        @Param('id') id: string,
        @Param('documentId') documentId: string
    ) {
        return this.studentScholarshipsService.removeRequiredDocument(id, documentId);
    }
} 