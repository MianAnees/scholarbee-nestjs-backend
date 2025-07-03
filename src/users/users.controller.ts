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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResourceProtectionGuard } from '../auth/guards/resource-protection.guard';
import { CreateEducationalBackgroundDto } from 'src/users/dto/create-educational-bg.dto';
import { CreateNationalIdCardDto } from 'src/users/dto/create-nic.dto';
import { UpdateNationalIdCardDto } from 'src/users/dto/update-nic.dto';
import { UpdateEducationalBackgroundDto } from 'src/users/dto/update-educational-bg.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(ResourceProtectionGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get()
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post(':userId/educational-backgrounds')
  addEducationalBackground(
    @Param('userId') userId: string,
    @Body() payload: CreateEducationalBackgroundDto,
  ) {
    return this.usersService.addEducationalBackground(userId, payload);
  }

  @UseGuards(ResourceProtectionGuard)
  @Post(':id/national-id-card')
  addNationalIdCard(
    @Param('id') id: string,
    @Body() payload: CreateNationalIdCardDto,
  ) {
    return this.usersService.addNationalIdCard(id, payload);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id/educational-backgrounds/:backgroundId')
  updateEducationalBackground(
    @Param('id') id: string,
    @Param('backgroundId') backgroundId: string,
    @Body() payload: UpdateEducationalBackgroundDto,
  ) {
    return this.usersService.updateEducationalBackground(
      id,
      backgroundId,
      payload,
    );
  }

  @UseGuards(ResourceProtectionGuard)
  @Delete(':id/educational-backgrounds/:backgroundId')
  removeEducationalBackground(
    @Param('id') id: string,
    @Param('backgroundId') backgroundId: string,
  ) {
    return this.usersService.removeEducationalBackground(id, backgroundId);
  }

  @UseGuards(ResourceProtectionGuard)
  @Patch(':id/national-id-card')
  updateNationalIdCard(
    @Param('id') id: string,
    @Body() payload: UpdateNationalIdCardDto,
  ) {
    return this.usersService.updateNationalIdCard(id, payload);
  }

  @UseGuards(ResourceProtectionGuard)
  @Get('profile/me')
  getProfile(@Req() req: any) {
    return this.usersService.findOne(req.user.sub);
  }
}
