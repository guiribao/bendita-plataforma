import Jimp from 'jimp';
import type { UploadHandler } from '@remix-run/node';
import { gerarUuid } from '~/shared/Uuid.util';
import { writeStorageFile } from './local-storage.server';

const STORAGE_ENV = process.env.NODE_ENV || 'development';
const FILE_FIELDS = ['identificacao_1', 'identificacao_2', 'comprovante_residencia',
  'receita_uso_canabis', 'autorizacao_anvisa', 'identificacao_responsavel_1', 'identificacao_responsavel_2'];
const FILE_FORMAT = ['image/jpeg', 'image/png', 'application/pdf'];

const uploadStorageFile = async (data: Buffer, key: string) => {
  await writeStorageFile(key, data);
  return key;
};

async function convertToBuffer(data: AsyncIterable<Uint8Array>) {
  const result: Uint8Array[] = [];
  for await (const chunk of data) {
    result.push(chunk);
  }

  return Buffer.concat(result);
}

async function convertToString(data: AsyncIterable<Uint8Array>) {
  const result: string[] = [];
  for await (const letter of data) {
    result.push(new TextDecoder().decode(letter));
  }

  return result.join('');
}


export const localUploadHandler: UploadHandler = async ({ name, data, filename, contentType }) => {
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

  let fileBuffer = await convertToBuffer(data);
  let folderAndFile = '';

  if (fileBuffer.length === 0)
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

  return await uploadStorageFile(finalFile!, folderAndFile!);
};
