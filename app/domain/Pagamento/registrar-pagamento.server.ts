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

    const mensalidadeNoMes = await prisma.pagamento.findFirst({
      where: {
        associadoId,
        data_pagamento: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
        observacao: {
          contains: 'Mensalidade',
          mode: 'insensitive',
        },
      },
    });

    if (mensalidadeNoMes) {
      return { ok: false, reason: 'ja_registrado_mes_atual' };
    }

    const proximoVencimento = startOfDay(addDays(hoje, 30));

    // Criar novo pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        associadoId,
        data_pagamento: hoje,
        proximo_vencimento: proximoVencimento,
        observacao: 'Mensalidade',
      },
    });

    return { ok: true, pagamento };
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return { ok: false, reason: 'erro' };
  }
}
