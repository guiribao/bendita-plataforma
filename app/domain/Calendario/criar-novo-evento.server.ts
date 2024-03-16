import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function criarNovoEvento(
  tipoEvento: string,
  titulo: string,
  descricao: string,
  vestimenta: string,
  dataHora: string,
  trabalho_terco: boolean,
  trabalho_missa: boolean,
  trabalho_fechado: boolean
) {
  try {
    const evento = await prisma.eventos.create({
      data: {
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
