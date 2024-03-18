import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function perfilPorEmailCpf(
  email: string,
  cpf: string
): Promise<Perfil | null> {
  try {
    const perfil = await prisma.perfil.findFirst({
      where: {
        OR: [{ email: { equals: email } }, { cpf: { equals: cpf } }],
      },
      include: {
        usuario: true
      }
    });

    return perfil;
  } catch (error) {
    return null;
  }
}
