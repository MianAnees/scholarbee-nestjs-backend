import { CreateBucketCommand, DeleteObjectCommand, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface IPaginationOptions {
    limit?: number;
    // page?: number;
}

@Injectable()
export class FileUploadService {
    private readonly bucketName = 'scolarbee-s3-bucket'; // TODO: Receive from config

    private readonly s3Client = new S3Client({
        // TODO: Instead of using basic get method, create a wrapping appConfigService that will validate the env variables against the provided type and allow to access only the validated variables in a type-safe manner
        region: this.configService.getOrThrow<string>('S3_REGION'), // Query: Does the configService validate the env variables against the provided type?
        credentials: {
            accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY'),
            secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_KEY'),
        },
    });

    constructor(private readonly configService: ConfigService) { }


    async getFiles(pagination?: IPaginationOptions) {
        const limit = pagination?.limit || 10;

        // Then get the specific page
        const res = await this.s3Client.send(new ListObjectsV2Command({
            Bucket: this.bucketName,
            MaxKeys: limit,
            // TODO: Implement pagination
            // StartAfter: page > 1 ? this.calculateStartAfter(page, limit) : undefined,
        }));

        const files = res.Contents?.map(file => ({
            key: file.Key,
            lastModified: file.LastModified,
            size: file.Size,
        })) || [];

        return {
            files,
        };
    }


    async uploadFile(file: Express.Multer.File, fileName?: string) {

        const res = await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName || file.originalname,
            Body: file.buffer,
        }));

        console.log('File uploaded');
        return res;
    }

    async deleteFile(file: Express.Multer.File, fileName?: string) {
        await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileName || file.originalname,
        }));
    }

}   