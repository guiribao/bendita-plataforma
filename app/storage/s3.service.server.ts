import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3.gateway.server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Jimp from 'jimp';

const STORAGE_SPACE_NAME = process.env.STORAGE_SPACE || 's3_VAR_NAO_INFORMADA';
const STORAGE_ENV = process.env.NODE_ENV;
const INPUT_FIELDS = ['logo_banca'];
const INPUT_FORMAT = ['image/jpeg', 'image/png'];

const uploadStreamToS3 = async (data: Buffer, key: string, contentType: string) => {
  const params = {
    Bucket: STORAGE_SPACE_NAME,
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

  return result.concat();
}

//@ts-ignore
export const s3UploaderHandler = async ({ name, data, filename, contentType }) => {
  let processedImage = null;

  if (!INPUT_FIELDS.filter((f) => name.includes(f)).length) return await convertToString(data);
  if (!filename) return;

  if (!INPUT_FORMAT.includes(contentType))
    throw new Error(`${name}: formato do arquivo é inválido\nUtilize JPG ou PNG.`);

  //@ts-ignore
  let fileBuffer = await convertToBuffer(data);
  let newFilename = name;
  let folderAndFile = '';

  if (fileBuffer.length === 0 || !data) throw new Error(`${name}: arquivo inválido.`);

  if (fileBuffer.length > 3024302)
    throw new Error(`${name}: arquivo grande demais\nUtilize um arquivo de até 3mb.`);

  if (name.includes('logo_banca')) {
    if (contentType === 'image/jpeg') {
      newFilename += '.jpeg';
    }

    if (contentType === 'image/png') {
      newFilename += '.png';
    }

    processedImage = await Jimp.read(fileBuffer).then(async (image) => {
      image.quality(70);
      return await image.getBufferAsync(contentType);
    });

    folderAndFile = `${STORAGE_ENV}/logo_banca/${newFilename}`;
  }

  if (!folderAndFile.length) folderAndFile = `/${newFilename}`;

  return await uploadStreamToS3(processedImage || fileBuffer, folderAndFile!, contentType);
};

export async function getObjectUrlFromS3(key: string) {
  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: STORAGE_SPACE_NAME,
        Key: key,
      }),
      { expiresIn: 15 * 60 }
    );
  } catch (error) {
    console.log(error);
  }
}
