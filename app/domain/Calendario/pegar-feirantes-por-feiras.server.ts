import { prisma } from '~/secure/db.server';
import { Eventos } from '@prisma/client';

export default async function pegarFeirantesPorFeira(feiraId: string): Promise<Eventos | null> {
  try {
    const feirantes = await prisma.evento_Feirante.findMany({
      where: {
        eventoId: Number(feiraId)
      },
      include: {
        perfil: true,
        Operacao: {
          select: { valor: true },
        },
      },
    });


    for (let feirante of feirantes) {
      let soma = 0;
      feirante.Operacao.forEach(venda => soma += Number(venda.valor))
      feirante.valorVendas = soma;
      feirante.statusCaixa = feirante.caixa_aberto ? "ABERTO" : "FECHADO"
    }

    return feirantes;

  } catch (error) {
    return null;
  }
}
