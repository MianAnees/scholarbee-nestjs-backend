import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { BlogPost, BlogPostDocument, BlogCategory } from '../schemas/blog-post.schema';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { QueryBlogPostDto } from '../dto/query-blog-post.dto';

@Injectable()
export class BlogPostsService {
    constructor(
        @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
    ) { }

    async create(createBlogPostDto: CreateBlogPostDto): Promise<BlogPostDocument> {
        try {
            const createdBlogPost = new this.blogPostModel(createBlogPostDto);
            return await createdBlogPost.save();
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async findAll(queryDto: QueryBlogPostDto): Promise<{
        posts: BlogPostDocument[],
        total: number,
        page: number,
        limit: number,
        totalPages: number
    }> {
        const {
            search,
            category,
            tag,
            featured,
            published,
            author_id,
            slug,
            published_after,
            published_before,
            page = 1,
            limit = 10,
            sortBy = 'published_at',
            sortOrder = 'desc'
        } = queryDto;

        const skip = (page - 1) * limit;
        const filter: any = {};

        // Apply filters
        if (search) {
            filter.$text = { $search: search };
        }

        if (category) {
            filter.category = category;
        }

        if (tag) {
            filter.tags = { $in: [tag] };
        }

        if (featured !== undefined) {
            filter.featured = featured;
        }

        if (published !== undefined) {
            filter.published = published;
        }

        if (author_id) {
            filter.author_id = new Types.ObjectId(author_id);
        }

        if (slug) {
            filter.slug = slug;
        }

        if (published_after || published_before) {
            filter.published_at = {};

            if (published_after) {
                filter.published_at.$gte = published_after;
            }

            if (published_before) {
                filter.published_at.$lte = published_before;
            }
        }

        // Only show published posts by default unless explicitly queried
        if (published === undefined) {
            filter.published = true;
        }

        const sort: { [key: string]: SortOrder } = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [posts, total] = await Promise.all([
            this.blogPostModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.blogPostModel.countDocuments(filter).exec(),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            posts,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async findOne(id: string): Promise<BlogPostDocument> {
        let blogPost;

        if (Types.ObjectId.isValid(id)) {
            blogPost = await this.blogPostModel.findById(id).exec();
        } else {
            // If not a valid ObjectId, try to find by slug
            blogPost = await this.blogPostModel.findOne({ slug: id }).exec();
        }

        if (!blogPost) {
            throw new NotFoundException(`Blog post with ID or slug ${id} not found`);
        }

        // Increment view count
        blogPost.views_count += 1;
        await blogPost.save();

        return blogPost;
    }

    async findByCategory(category: BlogCategory, queryDto: QueryBlogPostDto): Promise<{
        posts: BlogPostDocument[],
        total: number,
        page: number,
        limit: number,
        totalPages: number
    }> {
        // Override the category in the query
        queryDto.category = category;
        return this.findAll(queryDto);
    }

    async findByTag(tag: string, queryDto: QueryBlogPostDto): Promise<{
        posts: BlogPostDocument[],
        total: number,
        page: number,
        limit: number,
        totalPages: number
    }> {
        // Override the tag in the query
        queryDto.tag = tag;
        return this.findAll(queryDto);
    }

    async findFeatured(queryDto: QueryBlogPostDto): Promise<{
        posts: BlogPostDocument[],
        total: number,
        page: number,
        limit: number,
        totalPages: number
    }> {
        // Override the featured flag in the query
        queryDto.featured = true;
        return this.findAll(queryDto);
    }

    async update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPostDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid blog post ID');
        }

        const blogPost = await this.blogPostModel.findByIdAndUpdate(
            id,
            { $set: updateBlogPostDto },
            { new: true, runValidators: true }
        ).exec();

        if (!blogPost) {
            throw new NotFoundException(`Blog post with ID ${id} not found`);
        }

        return blogPost;
    }

    async remove(id: string): Promise<BlogPostDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid blog post ID');
        }

        const blogPost = await this.blogPostModel.findByIdAndDelete(id).exec();

        if (!blogPost) {
            throw new NotFoundException(`Blog post with ID ${id} not found`);
        }

        return blogPost;
    }

    async getStatistics(): Promise<any> {
        const [
            totalPosts,
            publishedPosts,
            draftPosts,
            featuredPosts,
            categoryStats,
            topViewedPosts,
            recentPosts
        ] = await Promise.all([
            this.blogPostModel.countDocuments().exec(),
            this.blogPostModel.countDocuments({ published: true }).exec(),
            this.blogPostModel.countDocuments({ published: false }).exec(),
            this.blogPostModel.countDocuments({ featured: true }).exec(),
            this.blogPostModel.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).exec(),
            this.blogPostModel.find({ published: true })
                .sort({ views_count: -1 })
                .limit(5)
                .select('title slug views_count published_at')
                .exec(),
            this.blogPostModel.find({ published: true })
                .sort({ published_at: -1 })
                .limit(5)
                .select('title slug published_at')
                .exec()
        ]);

        return {
            totalPosts,
            publishedPosts,
            draftPosts,
            featuredPosts,
            categoryStats: categoryStats.map(stat => ({
                category: stat._id,
                count: stat.count
            })),
            topViewedPosts,
            recentPosts
        };
    }
} 