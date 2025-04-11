import { BadRequestException, ConflictException, Controller, Delete, Get, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaManagementService } from 'src/media-management/media-management.service';

@Controller('media-management')
export class MediaManagementController {

    constructor(private readonly mediaManagementService: MediaManagementService) { }

    @Get('/')
    async getFiles(
        @Query('limit') limit?: number,
        // @Query('page') page?: number,
    ) {
        const res = await this.mediaManagementService.getFiles({
            limit: limit ? Number(limit) : undefined,
            // page: page ? Number(page) : 1,
        });
        return res;
    }

    @Get('/:fileKey')
    async getFile(@Param('fileKey') fileKey: string) {
        try {
            const res = await this.mediaManagementService.getFile(fileKey);
            return res;
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }

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
        ) file: Express.Multer.File, // Query: Where is this type coming from? Did i need to insteall the @types/multer for this?
    ) {
        try {
            const res = await this.mediaManagementService.uploadFile(file);
            return {
                status: 'success',
                message: 'File uploaded successfully',
                data: res,
            };
        } catch (error) {
            if (error.message.includes('already exists')) {
                throw new ConflictException(error.message);
            }
            throw new BadRequestException(error);
        }
    }

    @Delete('/')
    async deleteFile(@Query('fileKey') fileKey: string) {

        try {
            const res = await this.mediaManagementService.deleteFile(fileKey);
            return {
                status: 'success',
                message: 'File deleted successfully',
                data: res,
            };
        } catch (error) {
            // REVIEW: Shouldn't this exception be sent from the service?
            if (error.message.includes('does not exist')) {
                throw new NotFoundException(error.message);
            }
            throw new BadRequestException(error);
        }
    }
}
