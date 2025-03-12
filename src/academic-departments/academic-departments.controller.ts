import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AcademicDepartmentsService } from './academic-departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('academic-departments')
export class AcademicDepartmentsController {
    constructor(private readonly academicDepartmentsService: AcademicDepartmentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createAcademicDepartmentDto: any, @Param('userId') userId: string) {
        return this.academicDepartmentsService.create(createAcademicDepartmentDto, userId);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.academicDepartmentsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.academicDepartmentsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAcademicDepartmentDto: any) {
        return this.academicDepartmentsService.update(id, updateAcademicDepartmentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.academicDepartmentsService.remove(id);
    }
} 