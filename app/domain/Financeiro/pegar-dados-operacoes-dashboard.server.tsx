import { Operacao, Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarDadosOperacoesDashboard() {
  try {
    let ultimasDezOperacoes: Promise<Operacao[] | null> = await prisma.operacao.findMany({
      include: {
        feirante: {
          include: { perfil: { select: { nome: true, sobrenome: true } } },
        },
        evento: true,
      },
      take: 10,
      orderBy: { id: 'desc' },
    });
    let qtdOperacoes = await prisma.operacao.groupBy({
      by: ['tipo'],
      _count: true,
    });

    return { ultimasDezOperacoes, qtdOperacoes };
  } catch (error) {
    return null;
  }
}
