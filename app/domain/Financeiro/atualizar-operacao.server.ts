import { TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function atualizarOperacao(
  id: number,
  tipo: TipoOperacao,
  descricao: string,
  valor: string,
  perfilId: number | null
) {
  try {
    const operacao = await prisma.operacao.update({
      data: {
        tipo,
        descricao,
        valor,
        perfilId: parseInt(perfilId),
      },
      where: {
        id: parseInt(id),
      },
    });
    return operacao;
  } catch (error) {
    console.log(error);
    return null;
  }
}
