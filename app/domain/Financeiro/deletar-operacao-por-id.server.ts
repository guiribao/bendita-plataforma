import { prisma } from '~/secure/db.server';

export default async function deletarOperacaoPorId(operacaoId: number) {
  try {
    await prisma.operacao.delete({
      where: { id: operacaoId },
    });

  } catch (error) {
    console.log(error)
    return null
  }
}
