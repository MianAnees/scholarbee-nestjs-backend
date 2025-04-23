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
    Req,
    BadRequestException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { StudentScholarshipsService } from '../services/student-scholarships.service';
import { CreateStudentScholarshipDto } from '../dto/create-student-scholarship.dto';
import { AddRequiredDocumentDto, RemoveRequiredDocumentDto, UpdateStudentScholarshipApprovalStatusDto, UpdateStudentScholarshipDto } from '../dto/update-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ParseObjectIdPipe } from 'nestjs-object-id';
import { Types } from 'mongoose';

@Controller('student-scholarships')
export class StudentScholarshipsController {
    constructor(private readonly studentScholarshipsService: StudentScholarshipsService) { }

    @UseGuards(JwtAuthGuard, /* RolesGuard */)
    // @Roles(Role.ADMIN, Role.STUDENT) // REVIEW: Why the role?
    @Post()
    @HttpCode(HttpStatus.OK)
    create(
        @Req() req, // REVIEW: How to type it?
        @Body() createStudentScholarshipDto: CreateStudentScholarshipDto) {
        const userId = req.user.userId as string

        return this.studentScholarshipsService.create(createStudentScholarshipDto,userId);
    }

    @UseGuards(JwtAuthGuard/* , RolesGuard */)
    // @Roles(Role.ADMIN, Role.UNIVERSITY_ADMIN)
    @Patch(':id/approval')
    updateApprovalStatus(
        @Param('id') id: string,
        @Body() payload: UpdateStudentScholarshipApprovalStatusDto
    ) {
        return this.studentScholarshipsService.updateApprovalStatus(id, payload);
    }

    @Get()
    findAll(@Query() queryDto: QueryStudentScholarshipDto) {
        return this.studentScholarshipsService.findAll(queryDto);
    }

    @Get('statistics')
    getStatistics() {
        return this.studentScholarshipsService.getStatistics();
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.studentScholarshipsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard/* , RolesGuard */)
    // @Roles(Role.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateStudentScholarshipDto: UpdateStudentScholarshipDto
    ) {
        return this.studentScholarshipsService.update(id, updateStudentScholarshipDto);
    }

    @UseGuards(JwtAuthGuard/* , RolesGuard */)
    // @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.studentScholarshipsService.remove(id);
    }

    @UseGuards(JwtAuthGuard/* , RolesGuard */)
    // @Roles(Role.ADMIN)
    @Post(':studentScholarshipId/documents')
    addRequiredDocument(
        @Param('studentScholarshipId',ParseObjectIdPipe) studentScholarshipId: Types.ObjectId,
        @Body() addRequiredDocumentDto: AddRequiredDocumentDto
    ) {
        return this.studentScholarshipsService.addRequiredDocument(studentScholarshipId, addRequiredDocumentDto);
    }

    @UseGuards(JwtAuthGuard/* , RolesGuard */)
    // @Roles(Role.ADMIN)
    // @Delete(':id/documents/:documentId')
    @Delete(':studentScholarshipId/documents')
    removeRequiredDocument(
        @Param('studentScholarshipId',ParseObjectIdPipe) studentScholarshipId: Types.ObjectId,
        @Body() removeRequiredDocumentDto: RemoveRequiredDocumentDto
    ) {
        return this.studentScholarshipsService.removeRequiredDocument(studentScholarshipId, removeRequiredDocumentDto);
    }
} 