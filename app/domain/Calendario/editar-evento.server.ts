import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function editarEvento(
  tipoEvento: string,
  titulo: string,
  descricao: string,
  vestimenta: string,
  dataHora: string,
  trabalho_terco: boolean,
  trabalho_missa: boolean,
  trabalho_fechado: boolean,
  eventoId: number = NaN
) {
  
  console.log(eventoId);

  try {
    const evento = await prisma.eventos.upsert({
      where: {
        id: eventoId,
      },
      update: {
        titulo,
        descricao,
        tipo: tipoEvento as TipoEvento,
        vestimenta: (vestimenta as TipoFarda) || TipoFarda.NAO_APLICA,
        data_hora: new Date(dataHora),
        trabalho_terco: trabalho_terco,
        trabalho_missa: trabalho_missa,
        trabalho_fechado: trabalho_fechado,
      },
      create: {
        titulo,
        descricao,
        tipo: tipoEvento as TipoEvento,
        vestimenta: (vestimenta as TipoFarda) || TipoFarda.NAO_APLICA,
        data_hora: new Date(dataHora),
        trabalho_terco: trabalho_terco,
        trabalho_missa: trabalho_missa,
        trabalho_fechado: trabalho_fechado,
      },
    });

    return evento;
  } catch (error) {
    console.log(error);
    return null;
  }
}
