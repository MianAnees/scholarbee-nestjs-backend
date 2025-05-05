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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateAdmissionProgramDto } from '../dto/create-admission-program.dto';
import { FilterAdmissionProgramDto } from '../dto/filter-admission-program.dto';
import { QueryAdmissionProgramDto } from '../dto/query-admission-program.dto';
import { UpdateAdmissionProgramDto } from '../dto/update-admission-program.dto';
import { AdmissionProgramsService } from '../services/admission-programs.service';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history-analytics.service';
import {
  SearchResourceEnum,
  UserTypeEnum,
} from 'src/analytics/schemas/search-history.entity';
import { Request } from 'express';

@Controller('admission-programs')
export class AdmissionProgramsController {
  constructor(
    private readonly admissionProgramsService: AdmissionProgramsService,
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createAdmissionProgramDto: CreateAdmissionProgramDto,
    @Req() req,
  ) {
    return this.admissionProgramsService.create(
      createAdmissionProgramDto,
      req.user.userId,
    );
  }

  // REVIEW: Would it be better to put this in the `programService` directly or as a method of `searchHistoryAnalyticsService` itself?
  private async indexSearchHistory(
    user_id: string,
    fitlerDto: FilterAdmissionProgramDto,
  ) {
    const {
      // degree_level, major, mode_of_study, name: program_name, university_id
      major,
      university,
      programName,
    } = fitlerDto;

    // Track search event
    await this.searchHistoryAnalyticsService.indexDocument({
      timestamp: new Date(),
      user_id,
      user_type: UserTypeEnum.STUDENT,
      resource_type: SearchResourceEnum.UNIVERSITY,
      data: {
        major,
        // degree_level: degree_level as LastDegreeLevelEnum.,
        // mode_of_study,
        program_name: programName,
        university_id: university,
      },
    });
  }

  @Get()
  findAll(@Query() queryDto: QueryAdmissionProgramDto) {
    return this.admissionProgramsService.findAll(queryDto);
  }

  @Get('by-id/:id')
  findOne(
    @Param('id') id: string,
    @Query('populate') populate: boolean = true,
  ) {
    return this.admissionProgramsService.findOne(id, populate);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdmissionProgramDto: UpdateAdmissionProgramDto,
  ) {
    return this.admissionProgramsService.update(id, updateAdmissionProgramDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.admissionProgramsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorites')
  addToFavorites(@Param('id') id: string, @Req() req) {
    return this.admissionProgramsService.addToFavorites(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorites')
  removeFromFavorites(@Param('id') id: string, @Req() req) {
    return this.admissionProgramsService.removeFromFavorites(
      id,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/favorites')
  findFavorites(@Req() req, @Query() queryDto: QueryAdmissionProgramDto) {
    return this.admissionProgramsService.findFavorites(
      req.user.userId,
      queryDto,
    );
  }

  @Get('with-filters')
  async findWithFilters(
    @Query() filterDto: FilterAdmissionProgramDto,
    @Req() req: Request,
  ) {
    await this.indexSearchHistory(req.user?.['sub'], filterDto);
    const result =
      await this.admissionProgramsService.findWithFilters(filterDto);
    return result;
  }
}
