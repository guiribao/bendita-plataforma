import path from 'node:path';
import { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';
import { readStorageFile } from '~/storage/local-storage.server';
import { resolverLinkPrivadoDocumento } from '~/storage/documento-link.server';

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function getContentTypeByKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

function getContentDisposition(key: string): string {
  const filename = key.split('/').pop() || 'documento';
  const encodedFilename = encodeURIComponent(filename);
  return `inline; filename*=UTF-8''${encodedFilename}`;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request);
  if (!usuario) {
    return new Response('Não autenticado', { status: 401 });
  }

  const token = params.token;
  if (!token) {
    return new Response('Token inválido', { status: 400 });
  }

  const documento = await resolverLinkPrivadoDocumento(token, usuario.id);
  if (!documento) {
    return new Response('Link inválido ou expirado', { status: 403 });
  }

  try {
    const content = await readStorageFile(documento.key);
    const contentType = getContentTypeByKey(documento.key);

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': getContentDisposition(documento.key),
        'Cache-Control': 'private, max-age=60',
        'Content-Length': String(content.length),
      },
    });
  } catch (error) {
    console.error('Erro ao ler arquivo privado:', error);
    return new Response('Arquivo não encontrado', { status: 404 });
  }
}
