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
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';

@Controller('scholarships')
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body() createScholarshipDto: CreateScholarshipDto,
    @AuthReq() authReq: AuthenticatedRequest,
  ) {
    return this.scholarshipsService.create(
      createScholarshipDto,
      authReq.user.sub,
    );
  }

  @Get()
  findAll(@Query() queryDto: QueryScholarshipDto) {
    return this.scholarshipsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scholarshipsService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScholarshipDto: Partial<CreateScholarshipDto>,
  ) {
    return this.scholarshipsService.update(id, updateScholarshipDto);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scholarshipsService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post(':scholarshipId/favorites')
  addToFavorites(
    @Param('scholarshipId') scholarshipId: string,
    @AuthReq() authReq: AuthenticatedRequest,
  ) {
    return this.scholarshipsService.addToFavorites(
      scholarshipId,
      authReq.user.sub,
    );
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id/favorites')
  removeFromFavorites(
    @Param('id') id: string,
    @AuthReq() authReq: AuthenticatedRequest,
  ) {
    return this.scholarshipsService.removeFromFavorites(id, authReq.user.sub);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('user/favorites')
  findFavorites(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryScholarshipDto,
  ) {
    return this.scholarshipsService.findFavorites(authReq.user.sub, queryDto);
  }
} 