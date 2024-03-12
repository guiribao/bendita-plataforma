import { prisma } from '~/secure/db.server';

export default async function buscarPerfil(searchString: string) {
  try {
    let perfis = await prisma.perfil.findMany({
      where: {
        OR: [
          { nome: { contains: searchString, mode: 'insensitive' } },
          { sobrenome: { contains: searchString, mode: 'insensitive' } },
        ],
      },
    });

    return { perfis };
  } catch (error) {
    console.log(error);
    return null;
  }
}
