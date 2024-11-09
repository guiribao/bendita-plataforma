import { prisma } from '~/secure/db.server';
import { Eventos } from '@prisma/client';

export default async function pegarFeirantePorFeiraPerfil(feiraId: string, perfilId: string): Promise<Eventos | null> {
  try {
    const feirantes = await prisma.evento_Feirante.findFirst({
      where: {
        eventoId: Number(feiraId),
        perfilId: Number(perfilId)
      },
      include: {
        perfil: true,
        Operacao: true,
      },
    });

    return feirantes;
  } catch (error) {
    return null;
  }
}
