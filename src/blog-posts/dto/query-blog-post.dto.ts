import { IsOptional, IsString, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { BlogCategory } from '../schemas/blog-post.schema';

export class QueryBlogPostDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(BlogCategory)
    category?: BlogCategory;

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    featured?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    published?: boolean;

    @IsOptional()
    @IsString()
    author_id?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @Type(() => Date)
    published_after?: Date;

    @IsOptional()
    @Type(() => Date)
    published_before?: Date;

    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'published_at';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
} 