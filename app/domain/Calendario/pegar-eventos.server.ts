import { prisma } from '~/secure/db.server';
import { Eventos } from '@prisma/client';

export default async function pegarEventos(): Promise<Eventos[] | null> {
  try {
    const eventos = await prisma.eventos.findMany();

    return eventos || [];
  } catch (error) {
    return null;
  }
}
