import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
};

/**
 * Upload a file to S3 and return the public URL.
 * Falls back to returning a local path if S3 is not configured.
 */
export async function uploadToS3(filePath: string, key: string): Promise<string> {
  if (!isS3Configured()) {
    // Fallback: return local path relative to uploads dir
    const fileName = path.basename(filePath);
    return `/uploads/${fileName}`;
  }

  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME!;
  const fileContent = fs.readFileSync(filePath);

  // Determine content type from extension
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    })
  );

  // Clean up local file after successful upload
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors
  }

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!isS3Configured()) return;

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    })
  );
}

/**
 * Generate a presigned URL for temporary access to a private S3 object.
 * @param key - The S3 object key
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!isS3Configured()) {
    // Fallback: return local path
    return `/uploads/${path.basename(key)}`;
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  return awsGetSignedUrl(client, command, { expiresIn });
}

export { isS3Configured };
