import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { Controller, FileTypeValidator, Get, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Controller('file-upload')
export class FileUploadController {

    constructor(private readonly fileUploadService: FileUploadService) { }

    @Post('/')
    @UseInterceptors(FileInterceptor('file')) // Query: What if i don't use interceptor?
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1000_000 }), // 1mb
                    // new FileTypeValidator({ fileType: 'image/jpeg,image/png,image/jpg' }),
                ],
            })
        ) file: Express.Multer.File // Query: Where is this type coming from? Did i need to insteall the @types/multer for this?
    ) {
        const res = await this.fileUploadService.uploadFile(file);
        return res;
    }

    @Get('/')
    async getFiles(
        @Query('limit') limit?: number,
        // @Query('page') page?: number,
    ) {
        const res = await this.fileUploadService.getFiles({
            limit: limit ? Number(limit) : undefined,
            // page: page ? Number(page) : 1,
        });
        return res;
    }
}
