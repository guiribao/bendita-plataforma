import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarDadosEventosDashboard() {
  try {
    let eventos = await prisma.eventos.findMany({ take: 10, orderBy: {
      data_hora: 'asc'
    } });

    return eventos 

  } catch (error) {
    return null;
  }
}
