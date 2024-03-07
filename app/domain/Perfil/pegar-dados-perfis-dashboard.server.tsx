import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarDadosPerfisDashboard() {
  try {
    let ultimasDezPerfis = await prisma.perfil.findMany({ take: 10 });
    let qtdPerfis = await prisma.perfil.groupBy({
      by: ['grupo'],
      _count: true
    });

    return { ultimasDezPerfis, qtdPerfis }

  } catch (error) {
    return null;
  }
}
