import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarIndicacaoAssociado(perfilId, indicadoPor, elegivelTarifaSocial?: boolean): Promise<Associado | null> {
  try {    
    // Buscar o associado pelo perfilId
    const associadoExiste = await prisma.associado.findUnique({
      where: { perfilId: perfilId },
    });

    if (!associadoExiste) {
      console.error(`Associado com perfilId ${perfilId} não encontrado`);
      return null;
    }

    const dataToUpdate: any = {
      indicado_por: indicadoPor,
      elegivel_tarifa_social: elegivelTarifaSocial ?? false,
    };
    
    let associadoAtualizado = await prisma.associado.update({
      where: {
        perfilId: perfilId,
      },
      data: dataToUpdate,
    });
    return associadoAtualizado;
  } catch (error) {
    console.error('Erro ao atualizar indicação do associado:', error);
    return null;
  }
}
