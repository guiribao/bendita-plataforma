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
        criado_em: true,
      },
      orderBy: { nome: 'asc' },
    });

    return perfil;
  } catch (error) {
    return null;
  }
}
