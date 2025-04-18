import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEducationalBackgroundDto } from 'src/users/dto/create-educational-bg.dto';
import { CreateNationalIdCardDto } from 'src/users/dto/create-nic.dto';
import { UpdateNationalIdCardDto } from 'src/users/dto/update-nic.dto';
import { UpdateEducationalBackgroundDto } from 'src/users/dto/update-educational-bg.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() query: any) {
        return this.usersService.findAll(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/educational-backgrounds')
    addEducationalBackground(
        @Param('id') id: string,
        @Body() payload: CreateEducationalBackgroundDto,
    ) {

        return this.usersService.addEducationalBackground(id, payload);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/national-id-card')
    addNationalIdCard(
        @Param('id') id: string,
        @Body() payload: CreateNationalIdCardDto,
    ) {
        return this.usersService.addNationalIdCard(id, payload);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/educational-backgrounds/:backgroundId')
    updateEducationalBackground(
        @Param('id') id: string,
        @Param('backgroundId') backgroundId: string,
        @Body() payload: UpdateEducationalBackgroundDto,
    ) {
        return this.usersService.updateEducationalBackground(id, backgroundId, payload);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/educational-backgrounds/:backgroundId')
    removeEducationalBackground(
        @Param('id') id: string,
        @Param('backgroundId') backgroundId: string,
    ) {
        return this.usersService.removeEducationalBackground(id, backgroundId);
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':id/national-id-card')
    updateNationalIdCard(
        @Param('id') id: string,
        @Body() payload: UpdateNationalIdCardDto,
    ) {
        return this.usersService.updateNationalIdCard(id, payload);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile/me')
    getProfile(@Req() req: any) {
        return this.usersService.findOne(req.user.userId);
    }
} 