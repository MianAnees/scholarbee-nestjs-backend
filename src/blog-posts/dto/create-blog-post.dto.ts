import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { BlogCategory } from '../schemas/blog-post.schema';

export class CreateBlogPostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    markdown_content: string;

    @IsString()
    @IsNotEmpty()
    posted_by_name: string;

    @IsEmail()
    @IsNotEmpty()
    posted_by_email: string;

    @IsEnum(BlogCategory)
    @IsNotEmpty()
    category: BlogCategory;

    @IsString()
    @IsOptional()
    thumbnail?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    excerpt?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @IsBoolean()
    @IsOptional()
    published?: boolean;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    published_at?: Date;

    @IsString()
    @IsOptional()
    author_id?: string;
} 