import { prisma } from '~/secure/db.server';

export default async function buscarPerfil(searchString: string, opts) {
  try {
    let perfis = await prisma.perfil.findMany({
      where: {
        OR: [
          { nome: { contains: searchString, mode: 'insensitive' } },
          { sobrenome: { contains: searchString, mode: 'insensitive' } },
          { email: { contains: searchString, mode: 'insensitive' } },
          { cpf: { contains: searchString, mode: 'insensitive' } },
          
        ],
        ...(opts.onlyUsers ? { NOT: [{usuarioId: null}]  } : {})
      },
    });

    return { perfis };
  } catch (error) {
    console.log(error);
    return null;
  }
}
