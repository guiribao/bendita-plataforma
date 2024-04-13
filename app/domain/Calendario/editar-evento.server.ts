import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function editarEvento(eventoObj) {
  try {
    const evento = await prisma.eventos.update({
      where: {
        id: eventoObj.eventoId,
      },
      data: {
        titulo: eventoObj.titulo,
        descricao: eventoObj.descricao,
        tipo: eventoObj.tipoEvento as TipoEvento,
        vestimenta: (eventoObj.vestimenta as TipoFarda) || TipoFarda.NAO_APLICA,
        data_hora: new Date(eventoObj.dataHora),
        trabalho_terco: eventoObj.trabalho_terco,
        trabalho_missa: eventoObj.trabalho_missa,
        trabalho_fechado: eventoObj.trabalho_fechado,
        Feirantes: {
          createMany: {
            skipDuplicates: true,
            data: [
              ...eventoObj.feirantesIds.map((f) => ({
                perfilId: f,
              })),
            ],
          },
          deleteMany: [{ NOT: { perfilId: { in: eventoObj.feirantesIds } } }],
        },
      },
      select: {
        Feirantes: true,
      },
    });
    
    return evento;
  } catch (error) {
    console.log(error);
    return null;
  }
}
