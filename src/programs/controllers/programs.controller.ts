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
import { SearchResourceEnum, UserTypeEnum } from 'src/analytics/schemas/search-history.entity';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history-analytics.service';
import { LastDegreeLevelEnum } from 'src/student-scholarships/schemas/student-scholarship.schema';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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
        private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createProgramDto: CreateProgramDto) {
        return this.programsService.create(createProgramDto);
    }

    // REVIEW: Would it be better to put this in the `programService` directly or as a method of `searchHistoryAnalyticsService` itself?
    private async indexSearchHistory(user_id: string, queryDto: QueryProgramDto) {
        const { degree_level, major, mode_of_study, name: program_name, } = queryDto;

        // Track search event
        await this.searchHistoryAnalyticsService.indexDocument({
            timestamp: new Date(),
            user_id,
            user_type: UserTypeEnum.STUDENT,
            resource_type: SearchResourceEnum.PROGRAM,
            data: {
                major,
                degree_level: degree_level as LastDegreeLevelEnum,
                mode_of_study,
                program_name,
                university_id: queryDto.university_id,
            },
        });
    }

    @Get()
    async findAll(@Query() queryDto: QueryProgramDto, @Req() req: Request) {
        await this.indexSearchHistory(req.user?.['sub'], queryDto)
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

        await this.indexSearchHistory(req.user?.['sub'], queryDto)
        const result = await this.programsService.findByCampus(campusId, queryDto);
        return result;
    }

    @Get('university/:universityId')
    async findAllByUniversity(
        @Param('universityId') universityId: string,
        @Query() queryDto: QueryProgramDto,
        @Req() req: Request,
    ) {
        await this.indexSearchHistory(req.user?.['sub'], queryDto)
        const result = await this.programsService.findAllByUniversity(universityId, queryDto);
        return result;
    }

    @Get('academic-department/:departmentId')
    async findByAcademicDepartment(
        @Param('departmentId') departmentId: string,
        @Query() queryDto: QueryProgramDto,
        @Req() req: Request,
    ) {
        const result = await this.programsService.findByAcademicDepartment(departmentId, queryDto);
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