import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BlogPostDocument = BlogPost & Document;

export enum BlogCategory {
    SCHOLARSHIPS = 'scholarships',
    ADMISSIONS = 'admissions',
    STUDY_TIPS = 'study_tips',
    CAREER_ADVICE = 'career_advice',
    NEWS = 'news',
    EVENTS = 'events',
    OTHER = 'other'
}

@Schema({ timestamps: true, collection: 'blog_posts' })
export class BlogPost {
    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: String, required: true })
    markdown_content: string;

    @Prop({ type: String, required: true })
    posted_by_name: string;

    @Prop({ type: String, required: true })
    posted_by_email: string;

    @Prop({
        type: String,
        enum: Object.values(BlogCategory),
        default: BlogCategory.OTHER,
        required: true
    })
    category: string;

    @Prop({ type: String, required: false })
    thumbnail: string;

    @Prop({ type: String, required: false })
    slug: string;

    @Prop({ type: String, required: false })
    excerpt: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: Boolean, default: false })
    featured: boolean;

    @Prop({ type: Boolean, default: true })
    published: boolean;

    @Prop({ type: Date, default: Date.now })
    published_at: Date;

    @Prop({ type: Number, default: 0 })
    views_count: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
    author_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: Date, default: Date.now })
    updated_at: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);

// Add text index for search functionality
BlogPostSchema.index({
    title: 'text',
    markdown_content: 'text',
    tags: 'text'
});

// Add pre-save hook to generate slug if not provided
BlogPostSchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    if (!this.excerpt && this.markdown_content) {
        // Create excerpt from content (first 150 characters)
        this.excerpt = this.markdown_content
            .replace(/[#*`]/g, '')  // Remove markdown characters
            .substring(0, 150)
            .trim() + '...';
    }

    next();
}); 