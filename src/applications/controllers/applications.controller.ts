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
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  async create(@Body() createApplicationDto: CreateApplicationDto, @Req() req) {
    // Get the user ID from the JWT token
    const userId = req.user.sub;

    // Pass the user ID to the service to fetch user data and create application
    return this.applicationsService.createWithUserSnapshot(
      createApplicationDto,
      userId,
    );
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  // @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Get()
  findAll(@Query() queryDto: QueryApplicationDto) {
    return this.applicationsService.findAll(queryDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('my-applications')
  findMyApplications(@Req() req, @Query() queryDto: QueryApplicationDto) {
    return this.applicationsService.findByApplicant(req.user.sub, queryDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('statistics')
  getStatistics() {
    return this.applicationsService.getApplicationStatistics();
  }

  @UseGuards(ResourceProtectionGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('populate') populate: boolean = true,
  ) {
    return this.applicationsService.findOne(id, populate);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.applicationsService.updateStatus(id, status);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Post('update-application-status')
  async updateApplicationStatus(
    @Body() updateData: { applicationId: string; status: string },
  ) {
    const { applicationId, status } = updateData;

    if (!applicationId || !status) {
      throw new BadRequestException(
        'Missing applicationId or status in request body',
      );
    }

    if (!['Pending', 'Approved', 'Rejected', 'Under Review'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const updatedApplication = await this.applicationsService.updateStatus(
      applicationId,
      status,
    );

    return {
      message: 'Application status updated successfully',
      application: updatedApplication,
    };
  }
} 