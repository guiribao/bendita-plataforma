import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarIndicacaoAssociado(indicador, associadoId): Promise<Associado | null> {
  try {
    let associadoAtualizado = await prisma.associado.update({
      where: {
        id: associadoId,
      },
      data: {
        indicado_por: indicador,
      },
    });
    return associadoAtualizado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
