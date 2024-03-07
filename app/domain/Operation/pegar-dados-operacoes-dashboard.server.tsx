import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarDadosOperacoesDashboard() {
  try {
    let ultimasDezOperacoes = await prisma.operacao.findMany({ take: 10 });
    let qtdOperacoes = await prisma.operacao.groupBy({
      by: ['tipo'],
      _count: true
    });

    return { ultimasDezOperacoes, qtdOperacoes }

  } catch (error) {
    return null;
  }
}
