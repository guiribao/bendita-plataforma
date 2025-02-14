import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarTipoAssociado(tipo_associado, associadoId): Promise<Associado | null> {
  try {
    let associadoAtualizado = await prisma.associado.update({
      where: {
        id: associadoId,
      },
      data: {
        tipo_associado: tipo_associado,
      },
    });
    return associadoAtualizado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
