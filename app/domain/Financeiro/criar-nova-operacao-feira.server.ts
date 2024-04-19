import { FinalidadeOperacao, FormaPagamento, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function criarNovaOperacaoFeira(
  produto: string,
  nomeCliente: string,
  formaPagamento: FormaPagamento,
  valor: number,
  observacao: string,
  eventoId: number,
  feiranteId: number,
  usuarioId: number
) {
  try {
    const operacao = await prisma.operacao.create({
      data: {
        tipo: TipoOperacao.ENTRADA,
        finalidade: FinalidadeOperacao.FEIRA,
        nome_cliente: nomeCliente,
        produto,
        forma_pagamento: formaPagamento,
        valor,
        observacao,
        feiranteId,
        eventoId,
        criado_por: usuarioId,
      },
    });
    return operacao;
  } catch (error) {
    console.log(error);
    return null;
  }
}
