import { S3Client } from '@aws-sdk/client-s3';

const AWS_ACCESS_KEY: string = process.env.AWS_ACCESS_KEY || 's3_VAR_NAO_INFORMADA';
const AWS_ACCESS_SECRET: string = process.env.AWS_ACCESS_SECRET || 's3_VAR_NAO_INFORMADA';

const credentials = {
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_ACCESS_SECRET,
};

export const s3Client = (function createS3Client() {
  if ([AWS_ACCESS_KEY, AWS_ACCESS_SECRET].includes('s3_VAR_NAO_INFORMADA')) {
    console.warn('Cliente s3 não foi configurado corretamente.');
    return;
  }

  return new S3Client({
    region: 'sa-east-1',
    credentials
  });
})();
