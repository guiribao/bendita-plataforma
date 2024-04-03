import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarPerfis(): Promise<[] | null> {
  try {
    const perfil = await prisma.perfil.findMany({
      select: {
        id: true,
        foto: true,
        grupo: true,
        membro: true,
        nome: true,
        sobrenome: true,
        profissao: true,
        celular: true,
        usuarioId: true,
        primeira_vez: true,
        criado_em: true,
      },
      orderBy: { id: 'asc' },
    });

    return perfil;
  } catch (error) {
    return null;
  }
}
