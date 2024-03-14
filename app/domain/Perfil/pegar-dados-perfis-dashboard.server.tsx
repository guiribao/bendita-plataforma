import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarDadosPerfisDashboard() {
  try {
    let ultimosDezPerfis = await prisma.perfil.findMany({ take: 10 });
    let qtdPerfis = await prisma.perfil.groupBy({
      by: ['grupo'],
      _count: true
    });

    return { ultimosDezPerfis, qtdPerfis }

  } catch (error) {
    return null;
  }
}
