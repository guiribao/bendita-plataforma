import { prisma } from '~/secure/db.server';
import { Operacao } from '@prisma/client';

export default async function pegarOperacoesPorFeirante(
  feiranteId: string
): Promise<Operacao[] | null> {
  try {
    const operacao = await prisma.operacao.findMany({
      where: {
        feiranteId: Number(feiranteId),
      },
    });

    return operacao;
  } catch (error) {
    return null;
  }
}
