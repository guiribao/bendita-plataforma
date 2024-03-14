import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function criarNovoEvento(
  tipoEvento: TipoEvento,
  titulo: string,
  descricao: string,
  vestimenta: TipoFarda,
  dataHora: string
) {
  try {
    const evento = await prisma.eventos.create({
      data: {
        tipo,
        descricao,
        valor,
        perfilId: parseInt(perfilId),
        criado_por: parseInt(usuarioId),
      },
    });
    return operacao;
  } catch (error) {
    console.log(error);
    return null;
  }
}
