import { prisma } from '~/secure/db.server';
import { startOfDay } from 'date-fns';

export default async function verificarPagamentoVigente(associadoId: string) {
  const hoje = startOfDay(new Date());

  try {
    // Busca o pagamento mais recente do associado
    const pagamento = await prisma.pagamento.findFirst({
      where: {
        associadoId,
        proximo_vencimento: {
          gte: hoje, // Vencimento maior ou igual a hoje (ainda não venceu)
        },
      },
      orderBy: {
        proximo_vencimento: 'desc',
      },
    });

    return pagamento !== null;
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return false;
  }
}
