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
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { CreateAdmissionProgramDto } from '../dto/create-admission-program.dto';
import { FilterAdmissionProgramDto } from '../dto/filter-admission-program.dto';
import { QueryAdmissionProgramDto } from '../dto/query-admission-program.dto';
import { UpdateAdmissionProgramDto } from '../dto/update-admission-program.dto';
import { AdmissionProgramsService } from '../services/admission-programs.service';
import {
  SearchResourceEnum,
  UserTypeEnum,
} from 'src/elasticsearch/mappings/search-history.mapping';
import { Request } from 'express';

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
}
