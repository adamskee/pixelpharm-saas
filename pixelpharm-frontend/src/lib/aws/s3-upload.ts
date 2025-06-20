import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class S3UploadService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME!;
  }

  async generatePresignedUrl(
    fileName: string,
    fileType: string,
    userId: string
  ): Promise<string> {
    const key = `uploads/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
      ServerSideEncryption: "AES256",
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  getFileKey(userId: string, fileName: string): string {
    return `uploads/${userId}/${Date.now()}-${fileName}`;
  }
}
