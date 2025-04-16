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
import { ProgramsService } from '../services/programs.service';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { QueryProgramDto } from '../dto/query-program.dto';
import { CompareProgramsDto } from '../dto/compare-programs.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('programs')
export class ProgramsController {
    constructor(private readonly programsService: ProgramsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createProgramDto: CreateProgramDto) {
        return this.programsService.create(createProgramDto);
    }

    @Get()
    findAll(@Query() queryDto: QueryProgramDto) {
        return this.programsService.findAll(queryDto);
    }

    @Get('statistics')
    getStatistics() {
        return this.programsService.getStatistics();
    }

    @Get('campus/:campusId')
    findByCampus(
        @Param('campusId') campusId: string,
        @Query() queryDto: QueryProgramDto
    ) {
        return this.programsService.findByCampus(campusId, queryDto);
    }

    // get all programs by university
    @Get('university/:universityId')
    findByUniversity(
        @Param('universityId') universityId: string,
        @Query() queryDto: QueryProgramDto
    ) {
        return this.programsService.findAllByUniversity(universityId, queryDto);
    }

    @Get('academic-department/:departmentId')
    findByAcademicDepartment(
        @Param('departmentId') departmentId: string,
        @Query() queryDto: QueryProgramDto
    ) {
        return this.programsService.findByAcademicDepartment(departmentId, queryDto);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Query('populate') populate: boolean = true
    ) {
        return this.programsService.findOne(id, populate);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateProgramDto: UpdateProgramDto
    ) {
        return this.programsService.update(id, updateProgramDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
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