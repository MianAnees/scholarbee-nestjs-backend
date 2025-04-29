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
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UserEventLoggerService } from '../analytics/services/user-event-logger.service';
import { UserEventType } from '../analytics/types/user-event.types';

@Controller('universities')
export class UniversitiesController {
    constructor(
        private readonly universitiesService: UniversitiesService,
        private readonly userEventLogger: UserEventLoggerService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createUniversityDto: CreateUniversityDto, @Req() req: Request) {
        const userId = req.user['sub'];
        return this.universitiesService.create(createUniversityDto, userId);
    }

    @Get()
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sortBy') sortBy: string = 'createdAt',
        @Query('order') order: string = 'desc',
        @Req() req: Request,
    ) {
        const result = await this.universitiesService.findAll(page, limit, sortBy, order as any);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { page, limit, sortBy, order },
                results_count: result.data.length,
            },
        });

        return result;
    }

    @Get('open-programs')
    async findAllWithOpenPrograms(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sortBy') sortBy: string = 'createdAt',
        @Query('order') order: string = 'desc',
        @Req() req: Request,
    ) {
        const result = await this.universitiesService.findAllWithOpenPrograms(page, limit, sortBy, order as any);
        
        // Track search event
        await this.userEventLogger.logEvent({
            timestamp: new Date(),
            studentId: req.user?.['sub'],
            eventType: UserEventType.SEARCH,
            eventData: {
                filters: { 
                    page, 
                    limit, 
                    sortBy, 
                    order,
                    hasOpenPrograms: true 
                },
                results_count: result.data.length,
            },
        });

        return result;
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.universitiesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateUniversityDto: UpdateUniversityDto,
    ) {
        return this.universitiesService.update(id, updateUniversityDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.universitiesService.remove(id);
    }
} 