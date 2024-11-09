import { prisma } from '~/secure/db.server';
import { Eventos } from '@prisma/client';

export default async function pegarEventosFeiras(): Promise<Eventos | null> {
  try {
    const feiras = await prisma.eventos.findMany({
      where: {
        tipo: "FEIRA",
      },
      include: {
        Feirantes: false,
      },
    });

    return feiras;
  } catch (error) {
    return null;
  }
}
