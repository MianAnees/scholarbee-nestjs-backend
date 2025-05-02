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
import { SortOrder } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversitiesService } from './universities.service';
@Controller('universities')
export class UniversitiesController {
    constructor(
        private readonly universitiesService: UniversitiesService,
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
        @Query('order') order: SortOrder = 'desc',
        @Req() req: Request,
    ) {
        const result = await this.universitiesService.findAll(page, limit, sortBy, order);

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