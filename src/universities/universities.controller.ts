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

@Controller('universities')
export class UniversitiesController {
    constructor(private readonly universitiesService: UniversitiesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createUniversityDto: CreateUniversityDto, @Req() req: Request) {
        const userId = req.user['sub'];
        return this.universitiesService.create(createUniversityDto, userId);
    }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sortBy') sortBy: string = 'createdAt',
        @Query('order') order: string = 'desc',
    ) {
        return this.universitiesService.findAll(page, limit, sortBy, order as any);
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