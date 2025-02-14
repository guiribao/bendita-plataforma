import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarAssociadoPorId(associadoId): Promise<Associado | null> {
  try {
    const associado = await prisma.associado.findUnique({
      where: {
        id: associadoId
      }
    })

    return associado;
  } catch (error) {
    return null
  }
}