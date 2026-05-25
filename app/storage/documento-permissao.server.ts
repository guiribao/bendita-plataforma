import { EscopoPermissaoDocumento, Papel, TipoDocumento } from '@prisma/client';
import { prisma } from '~/secure/db.server';

type DocumentoComDono = {
  id: string;
  tipo: TipoDocumento;
  nome_arquivo: string;
  associado: {
    perfil: {
      usuarioId: number;
    };
  };
};

type UsuarioSolicitante = {
  id: number;
  papel: string;
};

function parsePapel(papel: string): Papel | null {
  if (!papel) return null;
  if (Object.values(Papel).includes(papel as Papel)) return papel as Papel;
  return null;
}

async function encontrarEscopoPermissao(papel: Papel, tipoDocumento: TipoDocumento): Promise<EscopoPermissaoDocumento | null> {
  const permissaoEspecifica = await prisma.permissaoSolicitacaoLinkDocumento.findFirst({
    where: {
      papel,
      tipoDocumento,
      ativo: true,
    },
    orderBy: { atualizado_em: 'desc' },
  });

  if (permissaoEspecifica) {
    return permissaoEspecifica.escopo;
  }

  const permissaoGenerica = await prisma.permissaoSolicitacaoLinkDocumento.findFirst({
    where: {
      papel,
      tipoDocumento: null,
      ativo: true,
    },
    orderBy: { atualizado_em: 'desc' },
  });

  return permissaoGenerica?.escopo ?? null;
}

export async function buscarDocumentoComDono(documentoId: string): Promise<DocumentoComDono | null> {
  return prisma.documentos.findUnique({
    where: { id: documentoId },
    select: {
      id: true,
      tipo: true,
      nome_arquivo: true,
      associado: {
        select: {
          perfil: {
            select: {
              usuarioId: true,
            },
          },
        },
      },
    },
  });
}

export async function podeSolicitarLinkDocumento(documento: DocumentoComDono, usuario: UsuarioSolicitante): Promise<boolean> {
  const papel = parsePapel(usuario.papel);
  if (!papel) return false;

  // Fallback de seguranca: admin sempre pode solicitar link privado.
  // Evita indisponibilidade total quando a tabela de permissoes nao foi migrada/populada.
  if (papel === Papel.ADMIN) return true;

  const escopo = await encontrarEscopoPermissao(papel, documento.tipo);
  if (!escopo || escopo === EscopoPermissaoDocumento.NENHUM) return false;
  if (escopo === EscopoPermissaoDocumento.TODOS) return true;

  if (escopo === EscopoPermissaoDocumento.PROPRIOS) {
    return documento.associado.perfil.usuarioId === usuario.id;
  }

  return false;
}
