import { TipoEvento, TipoFarda, TipoOperacao } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function editarPagamentoFeirante(eventoObj) {
  try {
    const evento = await prisma.evento_Feirante.update({
      where: {
        id: eventoObj.eventoFeiranteId,
      },
      data: {
        pagamento_agencia: eventoObj.pagamentoAgencia,
        pagamento_banco: eventoObj.pagamentoBanco,
        pagamento_conta: eventoObj.pagamentoConta,
        pagamento_chave_pix: eventoObj.pagamentoChavePix,

      },

    });

    return evento;
  } catch (error) {
    console.log(error);
    return null;
  }
}
