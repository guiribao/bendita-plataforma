import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Extrai o ID do arquivo do Google Drive de uma URL
 */
function extrairIdGoogleDrive(url: string): string | null {
  if (!url) return null;

  // Formatos possíveis:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  
  let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Faz download de um arquivo do Google Drive e upload para o S3
 */
export async function uploadGoogleDriveToS3(
  googleDriveUrl: string,
  perfilId: string
): Promise<string> {
  const fileId = extrairIdGoogleDrive(googleDriveUrl);
  
  if (!fileId) {
    throw new Error(`URL inválida do Google Drive: ${googleDriveUrl}`);
  }

  // URL de download direto do Google Drive
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    // Faz download do arquivo
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Tenta determinar o tipo de conteúdo
    let contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Extensão do arquivo baseada no content-type
    let extensao = '.pdf';
    if (contentType.includes('image/jpeg')) extensao = '.jpg';
    else if (contentType.includes('image/png')) extensao = '.png';
    else if (contentType.includes('image/')) extensao = '.jpg';
    else if (contentType.includes('pdf')) extensao = '.pdf';

    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const nomeArquivo = `importacao-${timestamp}${extensao}`;
    const s3Key = `documentos/${perfilId}/${nomeArquivo}`;

    // Upload para S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || '',
      Key: s3Key,
      Body: Buffer.from(response.data),
      ContentType: contentType,
    });

    await s3Client.send(uploadCommand);

    return s3Key;
  } catch (erro: any) {
    console.error('Erro ao transferir arquivo do Google Drive para S3:', erro);
    throw new Error(`Falha ao processar arquivo do Google Drive: ${erro.message}`);
  }
}
