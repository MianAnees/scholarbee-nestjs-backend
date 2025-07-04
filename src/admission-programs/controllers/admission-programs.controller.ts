import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { CreateAdmissionProgramDto } from '../dto/create-admission-program.dto';
import { FilterAdmissionProgramDto } from '../dto/filter-admission-program.dto';
import { QueryAdmissionProgramDto } from '../dto/query-admission-program.dto';
import { UpdateAdmissionProgramDto } from '../dto/update-admission-program.dto';
import { AdmissionProgramsService } from '../services/admission-programs.service';
import { QueryAdmissionProgramDegreeLevelsDto } from '../dto/query-admission-program-degree-levels.dto';
import { QueryAdmissionProgramMajorsDto } from '../dto/query-admission-program-majors.dto';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { QueryAdmissionProgramByIdDto } from '../dto/query-admission-program.dto';

@Controller('admission-programs')
export class AdmissionProgramsController {
  constructor(
    private readonly admissionProgramsService: AdmissionProgramsService,
  ) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(
    @Body() createAdmissionProgramDto: CreateAdmissionProgramDto,
    @Req() req,
  ) {
    return this.admissionProgramsService.create(
      createAdmissionProgramDto,
      req.user.sub,
    );
  }

  // /degree-levels
  @Get('degree-levels')
  findAllDegreeLevels(
    @Query()
    queryAdmissionProgramDegreeLevelsDto: QueryAdmissionProgramDegreeLevelsDto,
  ) {
    return this.admissionProgramsService.findAllDegreeLevels(
      queryAdmissionProgramDegreeLevelsDto,
    );
  }

  // /majors
  @Get('majors')
  findAllMajors(
    @Query() queryAdmissionProgramMajorsDto: QueryAdmissionProgramMajorsDto,
  ) {
    return this.admissionProgramsService.findAllMajors(
      queryAdmissionProgramMajorsDto,
    );
  }

  @Get()
  findAll(@Query() queryDto: QueryAdmissionProgramDto) {
    return this.admissionProgramsService.findAll(queryDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('user/favorites')
  findFavorites(@Req() req, @Query() queryDto: QueryAdmissionProgramDto) {
    return this.admissionProgramsService.findFavorites(req.user.sub, queryDto);
  }

  @Get('with-filters')
  async findWithFilters(
    @Query() filterDto: FilterAdmissionProgramDto,
    @Req() req: Request,
  ) {
    await this.admissionProgramsService.indexAdmissionProgramSearchHistory(
      req.user?.['sub'],
      filterDto,
    );
    const result =
      await this.admissionProgramsService.findWithFilters(filterDto);
    return result;
  }

  @UseGuards(ResourceProtectionGuard)
  @Get(':admission_program_id')
  findOne(
    @AuthReq() authReq: AuthenticatedRequest,
    @Param('admission_program_id') admission_program_id: string,
    @Query() queryDto: QueryAdmissionProgramByIdDto,
  ) {
    return this.admissionProgramsService.findOne(
      admission_program_id,
      authReq.user,
      queryDto,
    );
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdmissionProgramDto: UpdateAdmissionProgramDto,
  ) {
    return this.admissionProgramsService.update(id, updateAdmissionProgramDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.admissionProgramsService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post(':id/favorites')
  addToFavorites(@Param('id') id: string, @Req() req) {
    return this.admissionProgramsService.addToFavorites(id, req.user.sub);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id/favorites')
  removeFromFavorites(@Param('id') id: string, @Req() req) {
    return this.admissionProgramsService.removeFromFavorites(id, req.user.sub);
  }
}
