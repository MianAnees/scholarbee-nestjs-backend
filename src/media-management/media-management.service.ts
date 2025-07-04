import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';
import { EnvValidationSchema } from 'src/config/validation/env.validation';

interface IPaginationOptions {
    limit?: number;
    // page?: number;
}

@Injectable()
export class MediaManagementService {
    private readonly bucketName: string;
    private readonly s3Client: S3Client;

    constructor(
        private readonly configService: ConfigService<IConfiguration & EnvValidationSchema, true>
    ) {
        const s3Config = this.configService.get('s3', { infer: true })!;
        const awsConfig = this.configService.get('aws', { infer: true })!;

        this.bucketName = s3Config.bucket;
        this.s3Client = new S3Client({
            region: s3Config.region,
            endpoint: s3Config.endpoint,
            credentials: {
                accessKeyId: awsConfig.accessKey,
                secretAccessKey: awsConfig.secretKey,
            },
        });
    }

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

    async getFile(fileKey: string) {
        // Create GetObject command
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
        });

        try {
            // Get file metadata
            const fileData = await this.s3Client.send(command);

            // Generate presigned URL (valid for 1 hour)
            const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

            return {
                key: fileKey,
                size: fileData.ContentLength,
                lastModified: fileData.LastModified,
                contentType: fileData.ContentType,
                downloadUrl: presignedUrl
            };
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                throw new Error(`File with name "${fileKey}" does not exist`);
            }
            throw error;
        }
    }

    async uploadFile(file: Express.Multer.File) {
        /**
         * This function generates a unique file key by appending a timestamp to the original file name.
         * It ensures that the file name is unique by adding a timestamp to the file name.
         * Input: 'image.123.jpg'
         * Output: 'image.123-1718192000000.jpg'
         * @param baseKey - The original file name.
         * @returns A unique file key with a timestamp appended to the original file name.
         */
        const getUniqueFileKey = (baseKey: string): string => {
            const timestamp = Date.now();
            const nameParts = baseKey.split('.'); // e.g. ['image', '123', 'jpg']
            const extension = nameParts.pop(); // e.g. 'jpg'
            const baseName = nameParts.join('.'); // e.g. 'image.123'
            return `${baseName}-${timestamp}.${extension}`; // e.g. 'image-123-1718192000000.jpg'
        };

        let fileKey = getUniqueFileKey(file.originalname);

        const res = await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
        }));

        const uploadedFile = {
            fileKey,
            etag: res.ETag,
        }

        return uploadedFile
    }

    async deleteFile(fileKey: string) {

        // Check if file exists
        const existingFiles = await this.s3Client.send(new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: fileKey,
            MaxKeys: 1,
        }));

        if (existingFiles.KeyCount === 0) {
            throw new Error(`File with name "${fileKey}" does not exist`);
        }

        await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
        }));

        return {
            fileKey,
        }

    }

}   