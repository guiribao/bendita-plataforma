import { prisma } from '~/secure/db.server';
import { Operacao } from '@prisma/client';

export default async function pegarOperacaoPorId(operacaoId: string): Promise<Operacao | null> {
  try {
    const curso = await prisma.operacao.findFirst({
      where: {
        id: Number(operacaoId)
      },
      include: {
        perfil: true
      }
    });

    return curso;
  } catch (error) {
    return null;
  }
}
