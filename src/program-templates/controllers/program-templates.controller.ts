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
import { ProgramTemplatesService } from '../services/program-templates.service';
import { CreateProgramTemplateDto } from '../dto/create-program-template.dto';
import { UpdateProgramTemplateDto } from '../dto/update-program-template.dto';
import { QueryProgramTemplateDto } from '../dto/query-program-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('program-templates')
export class ProgramTemplatesController {
    constructor(private readonly programTemplatesService: ProgramTemplatesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() createProgramTemplateDto: CreateProgramTemplateDto) {
        return this.programTemplatesService.create(createProgramTemplateDto);
    }

    @Get()
    findAll(@Query() queryDto: QueryProgramTemplateDto) {
        return this.programTemplatesService.findAll(queryDto);
    }

    @Get('statistics')
    getStatistics() {
        return this.programTemplatesService.getStatistics();
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.programTemplatesService.findBySlug(slug);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.programTemplatesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProgramTemplateDto: UpdateProgramTemplateDto) {
        return this.programTemplatesService.update(id, updateProgramTemplateDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.programTemplatesService.remove(id);
    }
} 