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
import { ResourceProtectionGuard } from '../auth/guards/resource-protection.guard';
import { CreateUniversityDto } from './dto/create-university.dto';
import { QueryUniversityDto } from './dto/query-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversitiesService } from './universities.service';

@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(
    @Body() createUniversityDto: CreateUniversityDto,
    @Req() req: Request,
  ) {
    const userId = req.user['sub'];
    return this.universitiesService.create(createUniversityDto, userId);
  }

  @Get()
  async findAll(@Query() queryDto: QueryUniversityDto) {
    const result = await this.universitiesService.findAll(queryDto);

    return result;
  }

  // TODO: Remove this endpoint when the admission_program_status is supported in the findAll method
  // TODO: change the endpoint route to /available-programs instead of /open-programs
  @Get('open-programs')
  async findAllWithAvailablePrograms(@Query() queryDto: QueryUniversityDto) {
    const result =
      await this.universitiesService.findAllWithAvailablePrograms(queryDto);

    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.universitiesService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ) {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.universitiesService.remove(id);
  }
} 