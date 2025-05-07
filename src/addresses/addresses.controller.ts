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
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ResourceProtectionGuard } from '../auth/guards/resource-protection.guard';
import { Request } from 'express';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(@Body() createAddressDto: CreateAddressDto, @Req() req: Request) {
    const userId = req.user['sub'];
    return this.addressesService.create(createAddressDto, userId);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('order') order: string = 'desc',
  ) {
    return this.addressesService.findAll(page, limit, sortBy, order as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(id, updateAddressDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
} 