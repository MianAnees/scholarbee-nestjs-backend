import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from 'nestjs-object-id';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { CreateStudentScholarshipDto } from '../dto/create-student-scholarship.dto';
import { QueryStudentScholarshipDto } from '../dto/query-student-scholarship.dto';
import {
  AddRequiredDocumentDto,
  RemoveRequiredDocumentDto,
  UpdateStudentScholarshipApprovalStatusDto,
  UpdateStudentScholarshipDto,
} from '../dto/update-student-scholarship.dto';
import { StudentScholarshipsService } from '../services/student-scholarships.service';

@Controller('student-scholarships')
export class StudentScholarshipsController {
  constructor(
    private readonly studentScholarshipsService: StudentScholarshipsService,
  ) {}

  @UseGuards(ResourceProtectionGuard /* RolesGuard */)
  // @Roles(Role.ADMIN, Role.STUDENT) // REVIEW: Why the role?
  @Post()
  @HttpCode(HttpStatus.OK)
  create(
    @Req() req, // REVIEW: How to type it?
    @Body() createStudentScholarshipDto: CreateStudentScholarshipDto,
  ) {
    const userId = req.user.sub as string;

    return this.studentScholarshipsService.create(
      createStudentScholarshipDto,
      userId,
    );
  }

  @UseGuards(ResourceProtectionGuard /* , RolesGuard */)
  // @Roles(Role.ADMIN, Role.UNIVERSITY_ADMIN)
  @Patch(':id/approval')
  updateApprovalStatus(
    @Param('id') id: string,
    @Body() payload: UpdateStudentScholarshipApprovalStatusDto,
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

  @UseGuards(ResourceProtectionGuard /* , RolesGuard */)
  // @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentScholarshipDto: UpdateStudentScholarshipDto,
  ) {
    return this.studentScholarshipsService.update(
      id,
      updateStudentScholarshipDto,
    );
  }

  @UseGuards(ResourceProtectionGuard /* , RolesGuard */)
  // @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentScholarshipsService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard /* , RolesGuard */)
  // @Roles(Role.ADMIN)
  @Post(':studentScholarshipId/documents')
  addRequiredDocument(
    @Param('studentScholarshipId', ParseObjectIdPipe)
    studentScholarshipId: Types.ObjectId,
    @Body() addRequiredDocumentDto: AddRequiredDocumentDto,
  ) {
    return this.studentScholarshipsService.addRequiredDocument(
      studentScholarshipId,
      addRequiredDocumentDto,
    );
  }

  @UseGuards(ResourceProtectionGuard /* , RolesGuard */)
  // @Roles(Role.ADMIN)
  // @Delete(':id/documents/:documentId')
  @Delete(':studentScholarshipId/documents')
  removeRequiredDocument(
    @Param('studentScholarshipId', ParseObjectIdPipe)
    studentScholarshipId: Types.ObjectId,
    @Body() removeRequiredDocumentDto: RemoveRequiredDocumentDto,
  ) {
    return this.studentScholarshipsService.removeRequiredDocument(
      studentScholarshipId,
      removeRequiredDocumentDto,
    );
  }
} 