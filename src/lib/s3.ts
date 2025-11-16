import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_DEFAULT_REGION!;
const bucket = process.env.AWS_BUCKET!;

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(params: {
  key: string;
  contentType: string;
  body: Buffer;
}) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: "public-read",
  });

  await s3.send(command);
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);
}

export function getPublicUrl(key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
