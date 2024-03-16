import { prisma } from '~/secure/db.server';
import { Eventos, Operacao } from '@prisma/client';

export default async function pegarEventoPorId(eventoId: string): Promise<Eventos | null> {
  try {
    const evento = await prisma.eventos.findFirst({
      where: {
        id: Number(eventoId)
      },
    });

    return evento;
  } catch (error) {
    return null;
  }
}
