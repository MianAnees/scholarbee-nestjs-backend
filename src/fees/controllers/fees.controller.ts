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
import { FeesService } from '../services/fees.service';
import { CreateFeeDto } from '../dto/create-fee.dto';
import { UpdateFeeDto } from '../dto/update-fee.dto';
import { QueryFeeDto } from '../dto/query-fee.dto';
import { ResourceProtectionGuard } from '../../auth/guards/resource-protection.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feesService.create(createFeeDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get()
  findAll(@Query() queryDto: QueryFeeDto) {
    return this.feesService.findAll(queryDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('statistics')
  getStatistics() {
    return this.feesService.getStatistics();
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('program/:programId')
  findByProgramId(@Param('programId') programId: string) {
    return this.feesService.findByProgramId(programId);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeeDto: UpdateFeeDto) {
    return this.feesService.update(id, updateFeeDto);
  }

  @UseGuards(ResourceProtectionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
} 