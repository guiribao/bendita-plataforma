import { TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function criarNovaOperacao(
  tipo: TipoOperacao,
  descricao: string,
  valor: string,
  perfilId: number | null,
  usuarioId: number
) {
  try {
    const operacao = await prisma.operacao.create({
      data: {
        tipo,
        descricao,
        valor,
        perfilId: parseInt(perfilId),
        criado_por: parseInt(usuarioId),
      },
    });
    return operacao;
  } catch (error) {
    console.log(error);
    return null;
  }
}
