import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3.gateway.server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Jimp from 'jimp';
import { gerarUuid } from '~/shared/Uuid.util';

const S3_BUCKET_NAME = process.env.S3_BUCKET || 's3_VAR_NAO_INFORMADA';
const STORAGE_ENV = process.env.NODE_ENV;
const FILE_FIELDS = ['identificacao_1', 'identificacao_2', 'comprovante_residencia',
  'receita_uso_canabis', 'autorizacao_anvisa', 'identificacao_responsavel_1', 'identificacao_responsavel_2'];
const FILE_FORMAT = ['image/jpeg', 'image/png', 'application/pdf'];

const uploadStreamToS3 = async (data: Buffer, key: string, contentType: string) => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: data,
    ContentType: contentType,
  };

  try {
    //@ts-ignore
    const response = await s3Client.send(new PutObjectCommand(params));
    return response.$metadata.httpStatusCode === 200 ? key : false;
  } catch (error) {
    console.warn(error);
    return;
  }
};

async function convertToBuffer(a: AsyncIterable<Uint8Array>) {
  const result = [];
  for await (const chunk of a) {
    result.push(chunk);
  }

  return Buffer.concat(result);
}

async function convertToString(a: AsyncIterable<Uint8Array>) {
  const result = [];
  for await (const letter of a) {
    result.push(new TextDecoder().decode(letter));
  }

  return result.join();
}


//@ts-ignore
export const s3UploaderHandler = async ({ name, data, filename, contentType }) => {
  let finalFile = null;

  // Se não for um campo de arquivo (sem filename), retornar o valor como string
  if (!filename) {
    return await convertToString(data);
  }

  // Se o campo não está na lista de campos esperados de arquivo, ignorar
  if (!FILE_FIELDS.filter((f) => name.includes(f)).length) {
    return '';
  }

  if (!FILE_FORMAT.includes(contentType))
    throw new Error(`${name}: formato do arquivo é inválido\nUtilize JPG, PNG ou PDF.`);

  //@ts-ignore
  let fileBuffer = await convertToBuffer(data);
  let folderAndFile = '';

  if (fileBuffer.length === 0 || !data)
    throw new Error(`${name}: arquivo inválido.`);


  if (fileBuffer.length > 5242880)
    throw new Error(`${name}: arquivo grande demais\nUtilize um arquivo de até 5mb.`);

  if (["identificacao_1", "identificacao_2",
    "identificacao_responsavel_1", "identificacao_responsavel_2"].includes(name)) {

    let newFilename = gerarUuid()

    if (contentType === 'image/jpeg' || contentType === 'image/png') {
      if (contentType === 'image/png') {
        newFilename += '.png';
      } else {
        newFilename += '.jpeg';
      }
      finalFile = await Jimp.read(fileBuffer).then(async (image) => {
        image.quality(70);
        return await image.getBufferAsync(contentType);
      });
    }


    if (contentType === 'application/pdf') newFilename += '.pdf';

    folderAndFile = `${STORAGE_ENV}/documentos/identificacao/${newFilename}`;
  }

  if (["comprovante_residencia"].includes(name)) {

    let newFilename = gerarUuid()

    if (contentType === 'image/jpeg' || contentType === 'image/png') {
      if (contentType === 'image/png') {
        newFilename += '.png';
      } else {
        newFilename += '.jpeg';
      }
      finalFile = await Jimp.read(fileBuffer).then(async (image) => {
        image.quality(70);
        return await image.getBufferAsync(contentType);
      });
    }

    if (contentType === 'application/pdf') newFilename += '.pdf';

    folderAndFile = `${STORAGE_ENV}/documentos/residencia/${newFilename}`;
  }

  if (["receita_uso_canabis"].includes(name)) {
    let newFilename = gerarUuid()

    if (contentType === 'image/jpeg' || contentType === 'image/png') {
      if (contentType === 'image/png') {
        newFilename += '.png';
      } else {
        newFilename += '.jpeg';
      }
      finalFile = await Jimp.read(fileBuffer).then(async (image) => {
        image.quality(70);
        return await image.getBufferAsync(contentType);
      });
    }

    if (contentType === 'application/pdf') newFilename += '.pdf';

    folderAndFile = `${STORAGE_ENV}/documentos/receitas/${newFilename}`;
  }

  if (["autorizacao_anvisa"].includes(name)) {
    let newFilename = gerarUuid()

    if (contentType === 'image/jpeg' || contentType === 'image/png') {
      if (contentType === 'image/png') {
        newFilename += '.png';
      } else {
        newFilename += '.jpeg';
      }
      finalFile = await Jimp.read(fileBuffer).then(async (image) => {
        image.quality(70);
        return await image.getBufferAsync(contentType);
      });
    }

    if (contentType === 'application/pdf') newFilename += '.pdf';

    folderAndFile = `${STORAGE_ENV}/documentos/anvisa/${newFilename}`;
  }

  if (!finalFile) {
    finalFile = fileBuffer
  }

  if (!folderAndFile.length)
    throw new Error(`${name}: Erro ao processar upload do arquivo.`);

  return await uploadStreamToS3(finalFile!, folderAndFile!, contentType);
};

export async function getObjectUrlFromS3(key: string) {
  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 60 }
    );
  } catch (error) {
    console.log(error);
  }
}
