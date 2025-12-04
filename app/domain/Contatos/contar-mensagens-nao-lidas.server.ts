import { prisma } from '~/secure/db.server';

export async function contarMensagensNaoLidas(): Promise<number> {
  try {
    const count = await prisma.mensagem.count({
      where: {
        lido: false,
      },
    });
    return count;
  } catch (error) {
    console.error('Erro ao contar mensagens não lidas:', error);
    return 0;
  }
}
