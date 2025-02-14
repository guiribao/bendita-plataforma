import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function perfilPorCpf(
  cpf: string
): Promise<Perfil | null> {
  try {
    const perfil = await prisma.perfil.findFirst({
      where: {
        cpf: { equals: cpf }
      },
      include: {
        usuario: true,
      },
    });

    return perfil;
  } catch (error) {
    console.log(error)
    return null;
  }
}
