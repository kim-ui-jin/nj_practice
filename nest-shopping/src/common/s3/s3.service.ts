import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { Upload } from '@aws-sdk/lib-storage';


@Injectable()
export class S3Service {
    private readonly region = process.env.AWS_REGION!;
    private readonly bucket = process.env.AWS_S3_BUCKET!;
    private readonly publicBaseUrl =
        process.env.AWS_S3_PUBLIC_BASE_URL?.trim() ||
        `https://${this.bucket}.s3.${this.region}.amazonaws.com`;

    private readonly s3 = new S3Client({
        region: this.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
    });

    async uploadImage(
        file: Express.Multer.File,
        prefix: string
    ) {
        const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
        const key = `${prefix}/${Date.now()}-${randomUUID()}.${ext}`;

        await new Upload({
            client: this.s3,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype
            }
        }).done();

        return { key, url: `${this.publicBaseUrl}/${key}` };

    }
}