import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { CreateExternalApplicationDto } from './dto/create-external-application.dto';
import { QueryExternalApplicationDto } from './dto/query-external-application.dto';
import { ExternalApplicationsService } from './external-applications.service';

@Controller('external-applications')
@UseGuards(ResourceProtectionGuard)
export class ExternalApplicationsController {
  constructor(
    private readonly externalApplicationsService: ExternalApplicationsService,
  ) {}

  @Post()
  create(
    @Body() createExternalApplicationDto: CreateExternalApplicationDto,
    @Req() req,
  ) {
    return this.externalApplicationsService.create(
      req.user,
      createExternalApplicationDto,
    );
  }

  @Get()
  findAll(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryExternalApplicationDto,
  ) {
    return this.externalApplicationsService.findAll(authReq.user, queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.externalApplicationsService.findOne(id, req.user.sub);
  }
}
