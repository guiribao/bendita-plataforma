import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3.gateway.server';

const S3_BUCKET_NAME = process.env.S3_BUCKET || 's3_VAR_NAO_INFORMADA';

export async function deletarArquivoS3(key: string): Promise<boolean> {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
    };

    //@ts-ignore
    const response = await s3Client.send(new DeleteObjectCommand(params));
    
    if (response.$metadata.httpStatusCode === 204) {
      console.log(`[${new Date().toISOString()}] Arquivo S3 deletado: ${key}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao deletar arquivo S3: ${key}`, error);
    return false;
  }
}

export async function deletarVariosArquivosS3(keys: string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const key of keys) {
    const resultado = await deletarArquivoS3(key);
    if (resultado) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
