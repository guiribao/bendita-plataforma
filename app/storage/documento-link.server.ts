import { randomUUID } from 'node:crypto';
import { prisma } from '~/secure/db.server';
import { buscarDocumentoComDono, podeSolicitarLinkDocumento } from './documento-permissao.server';

type UsuarioSolicitante = {
  id: number;
  papel: string;
};

const DEFAULT_LINK_TTL_SECONDS = 120;

export async function solicitarLinkPrivadoDocumento(
  documentoId: string,
  usuario: UsuarioSolicitante,
  ttlSeconds = DEFAULT_LINK_TTL_SECONDS
): Promise<string | null> {
  const documento = await buscarDocumentoComDono(documentoId);
  if (!documento) return null;

  const permitido = await podeSolicitarLinkDocumento(documento, usuario);
  if (!permitido) return null;

  const agora = new Date();

  const linkExistente = await prisma.linkTemporarioDocumento.findFirst({
    where: {
      documentoId,
      usuarioId: usuario.id,
      expira_em: { gt: agora },
    },
    orderBy: {
      expira_em: 'desc',
    },
  });

  if (linkExistente) {
    return `/app/documentos/arquivo/${linkExistente.token}`;
  }

  const expiraEm = new Date(agora.getTime() + ttlSeconds * 1000);
  const token = randomUUID();

  await prisma.linkTemporarioDocumento.create({
    data: {
      token,
      documentoId,
      usuarioId: usuario.id,
      expira_em: expiraEm,
    },
  });

  return `/app/documentos/arquivo/${token}`;
}

export async function resolverLinkPrivadoDocumento(token: string, usuarioId: number): Promise<{ key: string } | null> {
  const agora = new Date();

  const link = await prisma.linkTemporarioDocumento.findFirst({
    where: {
      token,
      usuarioId,
      expira_em: { gt: agora },
    },
    include: {
      documento: {
        select: {
          nome_arquivo: true,
        },
      },
    },
  });

  if (!link?.documento?.nome_arquivo) return null;

  return { key: link.documento.nome_arquivo };
}
