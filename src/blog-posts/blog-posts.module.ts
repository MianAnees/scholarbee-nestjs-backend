import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPostsController } from './controllers/blog-posts.controller';
import { BlogPostsService } from './services/blog-posts.service';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: BlogPost.name, schema: BlogPostSchema }
        ])
    ],
    controllers: [BlogPostsController],
    providers: [BlogPostsService],
    exports: [BlogPostsService]
})
export class BlogPostsModule { } 