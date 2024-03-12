import { TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function criarNovaOperacao(
  tipo: TipoOperacao,
  descricao: string,
  valor: string,
  perfilId: number | null
) {
  try {
    const operacao = await prisma.operacao.create({
      data: { tipo, descricao, valor, perfilId: parseInt(perfilId) },
    });
    return operacao;
  } catch (error) {
    console.log(error);
    return null;
  }
}
