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
import { ApplicationsService } from '../services/applications.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
import { QueryApplicationDto } from '../dto/query-application.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('applications')
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createApplicationDto: CreateApplicationDto) {
        return this.applicationsService.create(createApplicationDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
    @Get()
    findAll(@Query() queryDto: QueryApplicationDto) {
        return this.applicationsService.findAll(queryDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-applications')
    findMyApplications(@Req() req, @Query() queryDto: QueryApplicationDto) {
        return this.applicationsService.findByApplicant(req.user.userId, queryDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('statistics')
    getStatistics() {
        return this.applicationsService.getApplicationStatistics();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Query('populate') populate: boolean = true) {
        return this.applicationsService.findOne(id, populate);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
        return this.applicationsService.update(id, updateApplicationDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.applicationsService.updateStatus(id, status);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.applicationsService.remove(id);
    }
} 