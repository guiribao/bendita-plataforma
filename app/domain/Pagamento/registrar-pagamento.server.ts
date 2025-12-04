import { prisma } from '~/secure/db.server';
import { addDays, startOfDay } from 'date-fns';

export default async function registrarPagamento(associadoId: string) {
  try {
    const hoje = new Date();
    const proximoVencimento = startOfDay(addDays(hoje, 30));

    // Criar novo pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        associadoId,
        data_pagamento: hoje,
        proximo_vencimento: proximoVencimento,
      },
    });

    return pagamento;
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return null;
  }
}
