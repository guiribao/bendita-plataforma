import Jimp from 'jimp';
import type { UploadHandler } from '@remix-run/node';
import { gerarUuid } from '~/shared/Uuid.util';
import { writeStorageFile } from './local-storage.server';
import { TAMANHO_MAXIMO_ARQUIVO, TAMANHO_MAXIMO_ARQUIVO_LABEL, FORMATOS_ARQUIVO_ACEITOS } from '~/shared/Arquivo.util';

const STORAGE_ENV = process.env.NODE_ENV || 'development';
const FILE_FORMAT = FORMATOS_ARQUIVO_ACEITOS;

/** Compressão aplicada às imagens antes de gravar no storage. */
const IMAGEM_DIMENSAO_MAXIMA = 2000;
const IMAGEM_QUALIDADE = 70;

/** Campo do formulário -> pasta de destino no storage. */
const PASTA_POR_CAMPO: Record<string, string> = {
  identificacao_1: 'identificacao',
  identificacao_2: 'identificacao',
  identificacao_responsavel_1: 'identificacao',
  identificacao_responsavel_2: 'identificacao',
  comprovante_residencia: 'residencia',
  receita_uso_canabis: 'receitas',
  autorizacao_anvisa: 'anvisa',
};

const FILE_FIELDS = Object.keys(PASTA_POR_CAMPO);

const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': '.jpeg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

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

/**
 * Reduz as dimensões e a qualidade da imagem para diminuir o tamanho gravado.
 * PDFs e formatos que o Jimp não conseguir ler são mantidos como estão.
 */
async function comprimirImagem(fileBuffer: Buffer, contentType: string) {
  if (contentType !== 'image/jpeg' && contentType !== 'image/png') return fileBuffer;

  try {
    const image = await Jimp.read(fileBuffer);

    if (image.getWidth() > IMAGEM_DIMENSAO_MAXIMA || image.getHeight() > IMAGEM_DIMENSAO_MAXIMA) {
      image.scaleToFit(IMAGEM_DIMENSAO_MAXIMA, IMAGEM_DIMENSAO_MAXIMA);
    }

    image.quality(IMAGEM_QUALIDADE);

    const comprimido = await image.getBufferAsync(contentType);

    return comprimido.length < fileBuffer.length ? comprimido : fileBuffer;
  } catch (error) {
    console.error('Não foi possível comprimir a imagem enviada:', error);
    return fileBuffer;
  }
}

function pastaDoCampo(name: string) {
  return PASTA_POR_CAMPO[name] ?? PASTA_POR_CAMPO[FILE_FIELDS.find((f) => name.includes(f)) ?? ''];
}

export const localUploadHandler: UploadHandler = async ({ name, data, filename, contentType }) => {
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

  const fileBuffer = await convertToBuffer(data);

  if (fileBuffer.length === 0)
    throw new Error(`${name}: arquivo inválido.`);

  if (fileBuffer.length > TAMANHO_MAXIMO_ARQUIVO)
    throw new Error(`${name}: arquivo grande demais\nUtilize um arquivo de até ${TAMANHO_MAXIMO_ARQUIVO_LABEL}.`);

  const pasta = pastaDoCampo(name);

  if (!pasta)
    throw new Error(`${name}: Erro ao processar upload do arquivo.`);

  const finalFile = await comprimirImagem(fileBuffer, contentType);
  const newFilename = `${gerarUuid()}${EXTENSAO_POR_TIPO[contentType]}`;
  const folderAndFile = `${STORAGE_ENV}/documentos/${pasta}/${newFilename}`;

  return await uploadStorageFile(finalFile, folderAndFile);
};
