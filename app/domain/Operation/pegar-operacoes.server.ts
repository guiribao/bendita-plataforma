import { prisma } from '~/secure/db.server';
import { Operacao } from '@prisma/client';

export default async function pegarOperacoes(): Promise<Operacao[] | null> {
  try {
    const operacao = await prisma.operacao.findMany();

    

    return operacao || [];
  } catch (error) {
    return null;
  }
}
