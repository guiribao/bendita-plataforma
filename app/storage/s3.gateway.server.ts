import { S3Client } from '@aws-sdk/client-s3';

const STORAGE_ENDPOINT: string = process.env.STORAGE_ENDPOINT || 's3_VAR_NAO_INFORMADA';
const STORAGE_KEY: string = process.env.STORAGE_KEY || 's3_VAR_NAO_INFORMADA';
const STORAGE_SECRET: string = process.env.STORAGE_SECRET || 's3_VAR_NAO_INFORMADA';

const credentials = {
  accessKeyId: STORAGE_KEY,
  secretAccessKey: STORAGE_SECRET,
};

export const s3Client = (function createS3Client() {
  if ([STORAGE_ENDPOINT, STORAGE_KEY, STORAGE_SECRET].includes('s3_VAR_NAO_INFORMADA')) {
    console.warn('Cliente s3 não foi configurado corretamente.');
    return;
  }

  return new S3Client({
    region: 'us-east-1',
    credentials,
    endpoint: STORAGE_ENDPOINT,
    forcePathStyle: false,
  });
})();
