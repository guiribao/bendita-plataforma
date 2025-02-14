import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function criarAssociado(perfilId): Promise<Associado | null> {
  try {
    let associadoCriado = await prisma.associado.create({
      data: {
        perfilId       
      },
    });

    return associadoCriado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
