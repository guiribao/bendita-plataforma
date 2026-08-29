import type { Prisma } from '@prisma/client';
import { prisma } from '~/secure/db.server';
import { deletarVariosArquivosLocais } from '~/storage/local-delete.server';

/**
 * Deleção em cascata dos recursos da plataforma.
 *
 * O banco não tem foreign keys (`relationMode = "prisma"`), então quem garante a
 * integridade é o Prisma Client. O schema declara `onDelete: Cascade` como rede
 * de segurança, e as funções deste módulo fazem a deleção explícita para poder
 * também remover os arquivos físicos e devolver quantidades de remessa.
 *
 * Regra de ouro: o banco é alterado dentro de uma transação e só depois os
 * arquivos saem do disco. Se a transação falhar, nada é apagado do storage.
 */

export type ResultadoDelecao = { success: boolean; message: string };

type ClientePrisma = Prisma.TransactionClient;

const TIMEOUT_TRANSACAO = 30_000;

function logar(mensagem: string) {
  console.log(`[${new Date().toISOString()}] ${mensagem}`);
}

function falha(contexto: string, error: unknown): ResultadoDelecao {
  console.error(`[${new Date().toISOString()}] ${contexto}:`, error);
  return {
    success: false,
    message: `${contexto}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
  };
}

async function removerArquivos(chaves: string[]) {
  const unicas = [...new Set(chaves.filter(Boolean))];
  if (!unicas.length) return;

  const resultado = await deletarVariosArquivosLocais(unicas);
  logar(`Arquivos locais deletados: ${resultado.success}/${unicas.length}`);
}

// --------------------------------------------------------------- primitivas

/**
 * Apaga documentos e tudo que depende deles, devolvendo as chaves dos arquivos
 * que precisam sair do disco depois que a transação fechar.
 */
async function apagarDocumentos(tx: ClientePrisma, where: Prisma.DocumentosWhereInput): Promise<string[]> {
  const documentos = await tx.documentos.findMany({
    where,
    select: { id: true, nome_arquivo: true },
  });

  if (!documentos.length) return [];

  const ids = documentos.map((documento) => documento.id);

  // Os links temporários apontam para o documento com relação obrigatória:
  // precisam sair antes, senão o Prisma recusa a deleção (P2014).
  await tx.linkTemporarioDocumento.deleteMany({ where: { documentoId: { in: ids } } });
  await tx.documentos.deleteMany({ where: { id: { in: ids } } });

  logar(`Documentos deletados: ${ids.length}`);

  return documentos.map((documento) => documento.nome_arquivo).filter(Boolean);
}

/** Apaga um associado inteiro: documentos, pagamentos e interesses. */
async function apagarAssociado(tx: ClientePrisma, associadoId: string): Promise<string[]> {
  const arquivos = await apagarDocumentos(tx, { associadoId });

  await devolverQuantidadeDeInteressesAprovados(tx, { associadoId });
  await tx.interesse.deleteMany({ where: { associadoId } });
  await tx.pagamento.deleteMany({ where: { associadoId } });
  await tx.associado.delete({ where: { id: associadoId } });

  logar(`Associado deletado: ${associadoId}`);

  return arquivos;
}

/**
 * Interesse aprovado já debitou da remessa: ao apagar, o saldo volta para não
 * deixar a remessa com quantidade disponível menor do que a real.
 */
async function devolverQuantidadeDeInteressesAprovados(tx: ClientePrisma, where: Prisma.InteresseWhereInput) {
  const aprovados = await tx.interesse.findMany({
    where: { ...where, aprovado: true },
    select: { remessaId: true, quantidade: true },
  });

  for (const interesse of aprovados) {
    await tx.remessa.update({
      where: { id: interesse.remessaId },
      data: { quantidade_disponivel: { increment: interesse.quantidade } },
    });
  }
}

/** Apaga o perfil, o usuário por trás dele e tudo que pende dos dois. */
async function apagarPerfilEUsuario(tx: ClientePrisma, perfilId: string): Promise<string[]> {
  const perfil = await tx.perfil.findUnique({
    where: { id: perfilId },
    select: { id: true, usuarioId: true, Associacao: { select: { id: true } } },
  });

  if (!perfil) return [];

  const arquivos: string[] = [];

  if (perfil.Associacao) {
    arquivos.push(...(await apagarAssociado(tx, perfil.Associacao.id)));
  }

  // Documentos que este perfil enviou para outras pessoas continuam válidos;
  // só perdem a referência de autoria.
  await tx.documentos.updateMany({ where: { criadoPorId: perfilId }, data: { criadoPorId: null } });

  // Usuario_Esqueci_Senha não tem relação declarada no schema, então nunca
  // entra em cascata automática.
  await tx.usuario_Esqueci_Senha.deleteMany({ where: { usuarioId: perfil.usuarioId } });
  await tx.linkTemporarioDocumento.deleteMany({ where: { usuarioId: perfil.usuarioId } });

  await tx.perfil.delete({ where: { id: perfilId } });
  await tx.usuario.delete({ where: { id: perfil.usuarioId } });

  logar(`Perfil e usuário deletados: ${perfilId} / ${perfil.usuarioId}`);

  return arquivos;
}

// ------------------------------------------------------------------ públicas

export async function deletarDocumento(documentoId: string): Promise<ResultadoDelecao> {
  try {
    const arquivos = await prisma.$transaction(
      (tx) => apagarDocumentos(tx, { id: documentoId }),
      { timeout: TIMEOUT_TRANSACAO },
    );

    if (!arquivos.length) {
      const aindaExiste = await prisma.documentos.findUnique({ where: { id: documentoId } });
      if (aindaExiste) return { success: false, message: 'Não foi possível deletar o documento.' };
      return { success: false, message: 'Documento não encontrado.' };
    }

    await removerArquivos(arquivos);

    return { success: true, message: 'Documento deletado com sucesso.' };
  } catch (error) {
    return falha('Erro ao deletar documento', error);
  }
}

export async function deletarPagamento(pagamentoId: string): Promise<ResultadoDelecao> {
  try {
    await prisma.pagamento.delete({ where: { id: pagamentoId } });
    logar(`Pagamento deletado: ${pagamentoId}`);
    return { success: true, message: 'Pagamento deletado com sucesso.' };
  } catch (error) {
    return falha('Erro ao deletar pagamento', error);
  }
}

export async function deletarInteresse(interesseId: string): Promise<ResultadoDelecao> {
  try {
    await prisma.$transaction(async (tx) => {
      await devolverQuantidadeDeInteressesAprovados(tx, { id: interesseId });
      await tx.interesse.delete({ where: { id: interesseId } });
    }, { timeout: TIMEOUT_TRANSACAO });

    logar(`Interesse deletado: ${interesseId}`);
    return { success: true, message: 'Interesse deletado com sucesso.' };
  } catch (error) {
    return falha('Erro ao deletar interesse', error);
  }
}

export async function deletarRemessa(remessaId: string): Promise<ResultadoDelecao> {
  try {
    const total = await prisma.$transaction(async (tx) => {
      const interesses = await tx.interesse.deleteMany({ where: { remessaId } });
      await tx.remessa.delete({ where: { id: remessaId } });
      return interesses.count;
    }, { timeout: TIMEOUT_TRANSACAO });

    logar(`Remessa deletada: ${remessaId} (${total} interesse(s) junto)`);

    const complemento = total > 0 ? ` e ${total} interesse(s) vinculado(s)` : '';
    return { success: true, message: `Remessa deletada com sucesso${complemento}.` };
  } catch (error) {
    return falha('Erro ao deletar remessa', error);
  }
}

export async function deletarContato(contatoId: string): Promise<ResultadoDelecao> {
  try {
    const total = await prisma.$transaction(async (tx) => {
      const mensagens = await tx.mensagem.deleteMany({ where: { contatoId } });
      // O CheckMail é histórico do IMAP e sobrevive ao contato, só perde o vínculo.
      await tx.checkMail.updateMany({ where: { contatoId }, data: { contatoId: null } });
      await tx.contato.delete({ where: { id: contatoId } });
      return mensagens.count;
    }, { timeout: TIMEOUT_TRANSACAO });

    logar(`Contato deletado: ${contatoId} (${total} mensagem(ns) junto)`);

    const complemento = total > 0 ? ` e ${total} mensagem(ns)` : '';
    return { success: true, message: `Contato deletado com sucesso${complemento}.` };
  } catch (error) {
    return falha('Erro ao deletar contato', error);
  }
}

export async function deletarAssociado(associadoId: string): Promise<ResultadoDelecao> {
  try {
    const arquivos = await prisma.$transaction(
      (tx) => apagarAssociado(tx, associadoId),
      { timeout: TIMEOUT_TRANSACAO },
    );

    await removerArquivos(arquivos);

    return { success: true, message: 'Associação deletada com sucesso.' };
  } catch (error) {
    return falha('Erro ao deletar associação', error);
  }
}

/**
 * Deleta o perfil, o usuário e todo o rastro deles. Dependentes que tenham este
 * perfil como responsável são deletados junto, incluindo os próprios usuários.
 */
export async function deletarPerfilCompleto(perfilId: string): Promise<ResultadoDelecao> {
  try {
    const perfil = await prisma.perfil.findUnique({
      where: { id: perfilId },
      select: {
        nome_completo: true,
        Dependentes: { select: { perfilId: true } },
      },
    });

    if (!perfil) {
      return { success: false, message: 'Perfil não encontrado.' };
    }

    logar(`Iniciando deleção do perfil: ${perfil.nome_completo} (${perfilId})`);

    const perfisDependentes = perfil.Dependentes.map((dependente) => dependente.perfilId)
      .filter((id) => id !== perfilId);

    const arquivos = await prisma.$transaction(async (tx) => {
      const chaves: string[] = [];

      for (const perfilDependente of perfisDependentes) {
        chaves.push(...(await apagarPerfilEUsuario(tx, perfilDependente)));
      }

      chaves.push(...(await apagarPerfilEUsuario(tx, perfilId)));

      return chaves;
    }, { timeout: TIMEOUT_TRANSACAO });

    await removerArquivos(arquivos);

    const dependentes = perfisDependentes.length;
    const complementoDependentes = dependentes > 0 ? ` e ${dependentes} dependente(s)` : '';

    return {
      success: true,
      message: `Perfil de ${perfil.nome_completo}${complementoDependentes} foi deletado com sucesso, incluindo ${arquivos.length} arquivo(s).`,
    };
  } catch (error) {
    return falha('Erro ao deletar perfil', error);
  }
}
