import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type PresignedUpload = {
  uploadUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
};

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string | null;

  constructor(configService: ConfigService) {
    const nodeEnv = configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const isTestEnv = nodeEnv === 'test';

    this.bucket = configService.get<string>('AWS_S3_BUCKET') ?? (isTestEnv ? 'taskflow-test' : '');

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    this.publicUrlBase =
      configService.get<string>('AWS_S3_PUBLIC_URL') ??
      (isTestEnv ? 'http://localhost:9000/taskflow-test' : null);

    const region = configService.get<string>('AWS_REGION') ?? 'us-east-1';
    const endpoint = configService.get<string>('AWS_S3_ENDPOINT');
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

    const clientConfig: S3ClientConfig = {
      region,
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.client = new S3Client(clientConfig);
  }

  async createPresignedUpload(
    key: string,
    contentType: string,
    expiresIn = 900,
  ): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      uploadUrl,
      headers: {
        'Content-Type': contentType,
      },
      expiresIn,
    };
  }

  getPublicUrl(key: string): string | null {
    if (!this.publicUrlBase) {
      return null;
    }

    const base = this.publicUrlBase.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
}
