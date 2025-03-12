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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('campuses')
export class CampusesController {
    constructor(private readonly campusesService: CampusesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createCampusDto: CreateCampusDto, @Req() req: Request) {
        const userId = req.user['sub'];
        return this.campusesService.create(createCampusDto, userId);
    }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sortBy') sortBy: string = 'createdAt',
        @Query('order') order: string = 'desc',
    ) {
        return this.campusesService.findAll(page, limit, sortBy, order as any);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.campusesService.findOne(id);
    }

    @Get('university/:universityId')
    findByUniversity(@Param('universityId') universityId: string) {
        return this.campusesService.findByUniversity(universityId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCampusDto: UpdateCampusDto) {
        return this.campusesService.update(id, updateCampusDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.campusesService.remove(id);
    }
} 