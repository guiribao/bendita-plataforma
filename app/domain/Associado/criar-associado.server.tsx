import { Associado, AssociacaoStatus } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function criarAssociado(perfilId, statusInicial?: AssociacaoStatus, elegivelTarifaSocial?: boolean): Promise<Associado | null> {
  try {
    let associadoCriado = await prisma.associado.create({
      data: {
        perfilId,
        status: statusInicial || AssociacaoStatus.AGUARDANDO_PAGAMENTO,
        elegivel_tarifa_social: elegivelTarifaSocial || false,
      },
    });

    return associadoCriado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
