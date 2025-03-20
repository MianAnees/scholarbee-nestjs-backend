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
import { BlogPostsService } from '../services/blog-posts.service';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { QueryBlogPostDto } from '../dto/query-blog-post.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BlogCategory } from '../schemas/blog-post.schema';

@Controller('blog-posts')
export class BlogPostsController {
    constructor(private readonly blogPostsService: BlogPostsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ADMIN)
    @Post()
    create(@Body() createBlogPostDto: CreateBlogPostDto) {
        return this.blogPostsService.create(createBlogPostDto);
    }

    @Get()
    findAll(@Query() queryDto: QueryBlogPostDto) {
        return this.blogPostsService.findAll(queryDto);
    }

    @Get('statistics')
    getStatistics() {
        return this.blogPostsService.getStatistics();
    }

    @Get('featured')
    findFeatured(@Query() queryDto: QueryBlogPostDto) {
        return this.blogPostsService.findFeatured(queryDto);
    }

    @Get('category/:category')
    findByCategory(
        @Param('category') category: BlogCategory,
        @Query() queryDto: QueryBlogPostDto
    ) {
        return this.blogPostsService.findByCategory(category, queryDto);
    }

    @Get('tag/:tag')
    findByTag(
        @Param('tag') tag: string,
        @Query() queryDto: QueryBlogPostDto
    ) {
        return this.blogPostsService.findByTag(tag, queryDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.blogPostsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateBlogPostDto: UpdateBlogPostDto
    ) {
        return this.blogPostsService.update(id, updateBlogPostDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.blogPostsService.remove(id);
    }
} 