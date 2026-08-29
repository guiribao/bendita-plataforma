import { Papel } from '@prisma/client';
import { authenticator } from './authentication.server';
import { prisma } from './db.server';

/**
 * Quem pode deletar o quê.
 *
 * TODOS    = pode deletar qualquer registro do recurso
 * PROPRIOS = só os registros que pertencem ao próprio usuário
 * NENHUM   = não pode deletar
 */
export type RecursoDeletavel =
  | 'perfil'
  | 'associado'
  | 'documento'
  | 'pagamento'
  | 'remessa'
  | 'interesse'
  | 'contato';

export type EscopoDelecao = 'TODOS' | 'PROPRIOS' | 'NENHUM';

const MATRIZ: Record<RecursoDeletavel, Partial<Record<Papel, EscopoDelecao>>> = {
  perfil: { [Papel.ADMIN]: 'TODOS' },
  associado: { [Papel.ADMIN]: 'TODOS' },
  documento: {
    [Papel.ADMIN]: 'TODOS',
    [Papel.SECRETARIA]: 'TODOS',
    [Papel.SAUDE]: 'TODOS',
    [Papel.ASSOCIADO]: 'PROPRIOS',
    [Papel.ASSOCIADO_DEPENDENTE]: 'PROPRIOS',
  },
  pagamento: {
    [Papel.ADMIN]: 'TODOS',
    [Papel.SECRETARIA]: 'TODOS',
  },
  remessa: { [Papel.ADMIN]: 'TODOS' },
  interesse: { [Papel.ADMIN]: 'TODOS' },
  contato: { [Papel.ADMIN]: 'TODOS' },
};

type UsuarioSessao = { id: number; papel: string };

export function escopoDelecao(recurso: RecursoDeletavel, papel: string | null | undefined): EscopoDelecao {
  if (!papel) return 'NENHUM';
  return MATRIZ[recurso][papel as Papel] ?? 'NENHUM';
}

/** Para o front-end decidir se mostra o botão de lixeira. */
export function podeVerAcaoDeletar(recurso: RecursoDeletavel, papel: string | null | undefined) {
  return escopoDelecao(recurso, papel) !== 'NENHUM';
}

/**
 * Exige que o usuário autenticado possa deletar o recurso. Devolve o usuário e
 * o escopo — o chamador ainda precisa checar a posse quando o escopo é PROPRIOS.
 */
export async function requirePermissaoDelecao(request: Request, recurso: RecursoDeletavel) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const escopo = escopoDelecao(recurso, usuario.papel);

  if (escopo === 'NENHUM') {
    throw new Response('Não autorizado', { status: 403 });
  }

  return { usuario: usuario as UsuarioSessao, escopo };
}

/** O documento pertence ao associado por trás deste usuário? */
export async function documentoPertenceAoUsuario(documentoId: string, usuarioId: number) {
  const documento = await prisma.documentos.findUnique({
    where: { id: documentoId },
    select: { associado: { select: { perfil: { select: { usuarioId: true } } } } },
  });

  if (!documento) return false;

  return documento.associado.perfil.usuarioId === usuarioId;
}
