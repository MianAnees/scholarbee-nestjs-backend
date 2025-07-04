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
} from '@nestjs/common';
import { RegionsService } from '../services/regions.service';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';
import { QueryRegionDto } from '../dto/query-region.dto';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryRegionDto) {
    return this.regionsService.findAll(queryDto);
  }

  @Get('statistics')
  getStatistics() {
    return this.regionsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/cities')
  addCity(@Param('id') id: string, @Body('city') city: string) {
    return this.regionsService.addCity(id, city);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/cities/:city')
  removeCity(@Param('id') id: string, @Param('city') city: string) {
    return this.regionsService.removeCity(id, city);
  }
} 