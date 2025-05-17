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
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CompareProgramsDto } from '../dto/compare-programs.dto';
import { CreateProgramDto } from '../dto/create-program.dto';
import { QueryProgramDto } from '../dto/query-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { ProgramsService } from '../services/programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
  ) {}

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryProgramDto, @Req() req: Request) {
    await this.programsService.indexProgramSearchHistory(req.user?.['sub'], queryDto);
    const result = await this.programsService.findAll(queryDto);
    return result;
  }

  @Get('statistics')
  getStatistics() {
    return this.programsService.getStatistics();
  }

  @Get('campus/:campusId')
  async findByCampus(
    @Param('campusId') campusId: string,
    @Query() queryDto: QueryProgramDto,
    @Req() req: Request,
  ) {
    await this.programsService.indexProgramSearchHistory(req.user?.['sub'], queryDto);
    const result = await this.programsService.findByCampus(campusId, queryDto);
    return result;
  }

  @Get('university/:universityId')
  async findAllByUniversity(
    @Param('universityId') universityId: string,
    @Query() queryDto: QueryProgramDto,
    @Req() req: Request,
  ) {
    await this.programsService.indexProgramSearchHistory(req.user?.['sub'], queryDto);
    const result = await this.programsService.findAllByUniversity(
      universityId,
      queryDto,
    );
    return result;
  }

  @Get('academic-department/:departmentId')
  async findByAcademicDepartment(
    @Param('departmentId') departmentId: string,
    @Query() queryDto: QueryProgramDto,
    @Req() req: Request,
  ) {
    const result = await this.programsService.findByAcademicDepartment(
      departmentId,
      queryDto,
    );
    return result;
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('populate') populate: boolean = true,
    @Req() req: Request,
  ) {
    const result = await this.programsService.findOne(id, populate);
    return result;
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }

  @Post('compare')
  comparePrograms(@Body() compareProgramsDto: CompareProgramsDto) {
    return this.programsService.comparePrograms(compareProgramsDto);
  }
} 