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
import { ProgramsService } from '../services/programs.service';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { QueryProgramDto } from '../dto/query-program.dto';
import { CompareProgramsDto } from '../dto/compare-programs.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserEventLoggerService } from '../../analytics/services/user-event-logger.service';
import { UserEventType } from '../../analytics/types/user-event.types';
import { Request } from 'express';

@Controller('programs')
export class ProgramsController {
    constructor(
        private readonly programsService: ProgramsService,
        private readonly userEventLogger: UserEventLoggerService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createProgramDto: CreateProgramDto) {
        return this.programsService.create(createProgramDto);
    }

    @Get()
    async findAll(@Query() queryDto: QueryProgramDto, @Req() req: Request) {
        const result = await this.programsService.findAll(queryDto);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: queryDto,
                results_count: result.total,
            },
        });

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
        const result = await this.programsService.findByCampus(campusId, queryDto);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { ...queryDto, campusId },
                results_count: result.total,
            },
        });

        return result;
    }

    @Get('university/:universityId')
    async findAllByUniversity(
        @Param('universityId') universityId: string,
        @Query() queryDto: QueryProgramDto,
        @Req() req: Request,
    ) {
        const result = await this.programsService.findAllByUniversity(universityId, queryDto);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { ...queryDto, universityId },
                results_count: result.total,
            },
        });

        return result;
    }

    @Get('academic-department/:departmentId')
    async findByAcademicDepartment(
        @Param('departmentId') departmentId: string,
        @Query() queryDto: QueryProgramDto,
        @Req() req: Request,
    ) {
        const result = await this.programsService.findByAcademicDepartment(departmentId, queryDto);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { ...queryDto, departmentId },
                results_count: result.total,
            },
        });

        return result;
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Query('populate') populate: boolean = true,
        @Req() req: Request,
    ) {
        const result = await this.programsService.findOne(id, populate);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { id, populate },
                results_count: result ? 1 : 0,
            },
        });

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