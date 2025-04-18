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
    Req
} from '@nestjs/common';
import { ScholarshipsService } from '../services/scholarships.service';
import { CreateScholarshipDto } from '../dto/create-scholarship.dto';
import { QueryScholarshipDto } from '../dto/query-scholarship.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@Controller('scholarships')
export class ScholarshipsController {
    constructor(private readonly scholarshipsService: ScholarshipsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createScholarshipDto: CreateScholarshipDto, @Req() req) {
        return this.scholarshipsService.create(createScholarshipDto, req.user.userId);
    }

    @Get()
    findAll(@Query() queryDto: QueryScholarshipDto) {
        return this.scholarshipsService.findAll(queryDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.scholarshipsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateScholarshipDto: Partial<CreateScholarshipDto>) {
        return this.scholarshipsService.update(id, updateScholarshipDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.scholarshipsService.remove(id);
    }
} 