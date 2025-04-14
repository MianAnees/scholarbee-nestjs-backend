import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
        @Body() educationalBackground: any,
    ) {

        console.log("educationalBackground:", educationalBackground)
        return this.usersService.addEducationalBackground(id, educationalBackground);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/national-id-card')
    addNationalIdCard(
        @Param('id') id: string,
        @Body() payload: {
            national_id_card: {
                front_side: string;
                back_side: string;
            };
            isProfileCompleted: boolean;
        },
    ) {

        return this.usersService.addNationalIdCard(id, payload);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/educational-backgrounds/:backgroundId')
    updateEducationalBackground(
        @Param('id') id: string,
        @Param('backgroundId') backgroundId: string,
        @Body() updatedData: any,
    ) {
        return this.usersService.updateEducationalBackground(id, backgroundId, updatedData);
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
        @Body() nationalIdCard: any,
    ) {
        return this.usersService.updateNationalIdCard(id, nationalIdCard);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile/me')
    getProfile(@Req() req: any) {
        return this.usersService.findOne(req.user.userId);
    }
} 