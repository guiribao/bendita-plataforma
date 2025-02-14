import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function criarDocumento(obj): Promise<Documento | null> {
  try {
    let documentoCriado = await prisma.documentos.create({
      data: {
        tipo: obj.tipo,
        nome_arquivo: obj.nome_arquivo,
        associadoId: obj.associadoId,
        criadoPorId: obj.criadoPorId
      },
    });

    return documentoCriado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
