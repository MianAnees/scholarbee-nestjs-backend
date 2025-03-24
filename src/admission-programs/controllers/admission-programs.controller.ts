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
    BadRequestException,
} from '@nestjs/common';
import { AdmissionProgramsService } from '../services/admission-programs.service';
import { CreateAdmissionProgramDto } from '../dto/create-admission-program.dto';
import { UpdateAdmissionProgramDto } from '../dto/update-admission-program.dto';
import { QueryAdmissionProgramDto } from '../dto/query-admission-program.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FilterAdmissionProgramDto } from '../dto/filter-admission-program.dto';

@Controller('admission-programs')
export class AdmissionProgramsController {
    constructor(private readonly admissionProgramsService: AdmissionProgramsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createAdmissionProgramDto: CreateAdmissionProgramDto, @Req() req) {
        return this.admissionProgramsService.create(createAdmissionProgramDto, req.user.userId);
    }

    @Get()
    findAll(@Query() queryDto: QueryAdmissionProgramDto) {
        return this.admissionProgramsService.findAll(queryDto);
    }

    @Get('by-id/:id')
    findOne(@Param('id') id: string, @Query('populate') populate: boolean = true) {
        return this.admissionProgramsService.findOne(id, populate);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAdmissionProgramDto: UpdateAdmissionProgramDto) {
        return this.admissionProgramsService.update(id, updateAdmissionProgramDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.admissionProgramsService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/favorites')
    addToFavorites(@Param('id') id: string, @Req() req) {
        return this.admissionProgramsService.addToFavorites(id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/favorites')
    removeFromFavorites(@Param('id') id: string, @Req() req) {
        return this.admissionProgramsService.removeFromFavorites(id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/favorites')
    findFavorites(@Req() req, @Query() queryDto: QueryAdmissionProgramDto) {
        return this.admissionProgramsService.findFavorites(req.user.userId, queryDto);
    }

    @Get('with-filters')
    findWithFilters(@Query() filterDto: FilterAdmissionProgramDto) {
        console.log(filterDto);
        return this.admissionProgramsService.findWithFilters(filterDto);
    }
} 