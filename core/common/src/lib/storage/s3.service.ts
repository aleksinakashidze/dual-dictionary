import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@dual-dictionary/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
}

export interface UploadOptions {
  mimeType: string;
  folder?: string;
  fileName?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client | null = null;

  constructor(private readonly config: AppConfigService) {
    if (
      config.awsRegion &&
      config.awsAccessKeyId &&
      config.awsSecretAccessKey
    ) {
      this.client = new S3Client({
        region: config.awsRegion,
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });
    } else {
      this.logger.warn('AWS credentials not set — S3 uploads disabled');
    }
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    this.assertConfigured();
    const bucket = this.config.awsS3Bucket!;
    const key = `${options.folder ?? 'uploads'}/${randomUUID()}-${options.fileName ?? 'file'}`;

    await this.client!.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: options.mimeType,
      }),
    );

    const url = `https://${bucket}.s3.${this.config.awsRegion}.amazonaws.com/${key}`;
    this.logger.log(`Uploaded → s3://${bucket}/${key}`);
    return { key, url };
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    this.assertConfigured();
    return getSignedUrl(
      this.client!,
      new GetObjectCommand({ Bucket: this.config.awsS3Bucket!, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    await this.client!.send(
      new DeleteObjectCommand({ Bucket: this.config.awsS3Bucket!, Key: key }),
    );
    this.logger.log(`Deleted → s3://${this.config.awsS3Bucket}/${key}`);
  }

  private assertConfigured(): void {
    if (!this.client || !this.config.awsS3Bucket) {
      throw new Error('S3 is not configured. Set AWS_* environment variables.');
    }
  }
}
