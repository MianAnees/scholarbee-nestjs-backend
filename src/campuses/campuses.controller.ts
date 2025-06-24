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
} from '@nestjs/common';
import { CampusesService } from './campuses.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { QueryCampusDto } from './dto/query-campus.dto';
import { ResourceProtectionGuard } from '../auth/guards/resource-protection.guard';
import { Request } from 'express';

@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(@Body() createCampusDto: CreateCampusDto, @Req() req: Request) {
    const userId = req.user['sub'];
    return this.campusesService.create(createCampusDto, userId);
  }

  @Get()
  async findAll(@Query() queryDto: QueryCampusDto) {
    const result = await this.campusesService.findAll(queryDto);

    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campusesService.findOne(id);
  }

  @Get('university/:universityId')
  findByUniversity(@Param('universityId') universityId: string) {
    return this.campusesService.findByUniversity(universityId);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCampusDto: UpdateCampusDto) {
    return this.campusesService.update(id, updateCampusDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campusesService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get(':id/has-admins')
  async hasValidAdmins(@Param('id') id: string) {
    const hasAdmins = await this.campusesService.hasValidAdmins(id);
    return { hasAdmins };
  }
}
