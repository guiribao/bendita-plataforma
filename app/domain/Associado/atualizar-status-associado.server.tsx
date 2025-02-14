import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarStatusAssociado(status, associadoId): Promise<Associado | null> {
  try {
    let associadoAtualizado = await prisma.associado.update({
      where: {
        id: associadoId,
      },
      data: {
        status: status,
      },
    });
    return associadoAtualizado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
