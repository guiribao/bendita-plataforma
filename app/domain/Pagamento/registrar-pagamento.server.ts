import { Prisma } from '@prisma/client';
import { prisma } from '~/secure/db.server';
import { addDays, endOfMonth, startOfDay, startOfMonth } from 'date-fns';

type RegistrarPagamentoResult =
  | { ok: true; pagamento: any }
  | { ok: false; reason: 'ja_registrado_mes_atual' | 'erro' };

export default async function registrarPagamento(associadoId: string): Promise<RegistrarPagamentoResult> {
  try {
    const hoje = new Date();
    const inicioMesAtual = startOfMonth(hoje);
    const fimMesAtual = endOfMonth(hoje);

    const proximoVencimento = startOfDay(addDays(hoje, 30));

    const pagamento = await prisma.$transaction(async (tx) => {
      const mensalidadeNoMes = await tx.pagamento.findFirst({
        where: {
          associadoId,
          data_pagamento: { gte: inicioMesAtual, lte: fimMesAtual },
          observacao: { contains: 'Mensalidade', mode: 'insensitive' },
        },
      });

      if (mensalidadeNoMes) {
        throw new Error('PAGAMENTO_JA_REGISTRADO');
      }

      return tx.pagamento.create({
        data: {
          associadoId,
          data_pagamento: hoje,
          proximo_vencimento: proximoVencimento,
          observacao: 'Mensalidade',
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    return { ok: true, pagamento };
  } catch (error: any) {
    if (error?.message === 'PAGAMENTO_JA_REGISTRADO' || error?.code === 'P2034') {
      return { ok: false, reason: 'ja_registrado_mes_atual' };
    }

    console.error('Erro ao registrar pagamento:', error);
    return { ok: false, reason: 'erro' };
  }
}
