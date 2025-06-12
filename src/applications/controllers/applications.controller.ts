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
import {
  UpdateApplicationDto,
  UpdateApplicationStatusDto,
} from '../dto/update-application.dto';
import { QueryApplicationDto } from '../dto/query-application.dto';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';

@UseGuards(ResourceProtectionGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  async create(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    // Pass the user ID to the service to fetch user data and create application
    return this.applicationsService.createWithUserSnapshot(
      authReq.user,
      createApplicationDto,
    );
  }

  @UseGuards(RolesGuard)
  // @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Get()
  findAll(@Query() queryDto: QueryApplicationDto) {
    return this.applicationsService.findAll(queryDto);
  }

  @Get('my-applications')
  findMyApplications(@Req() req, @Query() queryDto: QueryApplicationDto) {
    return this.applicationsService.findByApplicant(req.user.sub, queryDto);
  }

  @Get('statistics')
  getStatistics() {
    return this.applicationsService.getApplicationStatistics();
  }

  @Get('legal-documents')
  async getApplicationLegalRequirements() {
    return this.applicationsService.getApplicationLegalDocuments();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('populate') populate: boolean = true,
  ) {
    return this.applicationsService.findOne(id, populate);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @AuthReq() authReq: AuthenticatedRequest,
  ) {
    return this.applicationsService.update(
      id,
      updateApplicationDto,
      authReq.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(
      id,
      updateApplicationStatusDto.status,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAMPUS_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}
