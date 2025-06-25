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
    BadRequestException
} from '@nestjs/common';
import { AdmissionsService } from '../services/admissions.service';
import { CreateAdmissionDto } from '../dto/create-admission.dto';
import { UpdateAdmissionDto } from '../dto/update-admission.dto';
import { QueryAdmissionDto } from '../dto/query-admission.dto';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(@Body() createAdmissionDto: CreateAdmissionDto, @Req() req) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.admissionsService.create(createAdmissionDto, userId);
  }

  @Get()
  findAll(@Query() queryDto: QueryAdmissionDto) {
    return this.admissionsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('populate') populate: boolean = true,
  ) {
    return this.admissionsService.findOne(id, populate);
  }

  @Get('university/:universityId')
  findByUniversity(
    @Param('universityId') universityId: string,
    @Query() queryDto: QueryAdmissionDto,
  ) {
    return this.admissionsService.findByUniversity(universityId, queryDto);
  }

  @Get('campus/:campusId')
  findByCampus(
    @Param('campusId') campusId: string,
    @Query() queryDto: QueryAdmissionDto,
  ) {
    return this.admissionsService.findByCampus(campusId, queryDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ) {
    return this.admissionsService.update(id, updateAdmissionDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.admissionsService.remove(id);
  }
} 