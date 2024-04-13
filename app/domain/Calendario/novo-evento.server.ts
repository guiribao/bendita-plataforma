import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function novoEvento(novoEvento) {
  try {
    const evento = await prisma.eventos.create({
      data: {
        titulo: novoEvento.titulo,
        descricao: novoEvento.descricao,
        tipo: novoEvento.tipoEvento as TipoEvento,
        vestimenta: (novoEvento.vestimenta as TipoFarda) || TipoFarda.NAO_APLICA,
        data_hora: new Date(novoEvento.dataHora),
        trabalho_terco: novoEvento.trabalho_terco,
        trabalho_missa: novoEvento.trabalho_missa,
        trabalho_fechado: novoEvento.trabalho_fechado,
        Feirantes: {
          createMany: {
            data: [
              ...(novoEvento.feirantesIds.map((f) => ({
                perfilId: f,
              }))),
            ],
          },
        },
      },
      include: {
        Feirantes: !!novoEvento.feirantesIds.length
      }
    });

    return evento;
  } catch (error) {
    console.log(error);
    return null;
  }
}
