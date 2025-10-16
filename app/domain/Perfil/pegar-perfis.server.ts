import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarPerfis(): Promise<Perfil[] | null> {
  try {
    return await prisma.perfil.findMany({
      include: { usuario: true },
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    return null;
  }
}
