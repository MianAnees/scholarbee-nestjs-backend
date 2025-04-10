import { Controller, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file-upload')
export class FileUploadController {
    @Post('/')
    @UseInterceptors(FileInterceptor('file')) // Query: What if i don't use interceptor?
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1000_000 }), // 1mb
                    new FileTypeValidator({ fileType: 'image/jpeg' }),
                ],
            })
        ) file: Express.Multer.File // Query: Where is this type coming from? Did i need to insteall the @types/multer for this?
    ) {
        console.log(file);
        return;
    }
}
