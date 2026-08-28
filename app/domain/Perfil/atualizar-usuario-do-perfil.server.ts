import { prisma } from '~/secure/db.server';

export default async function atualizarUsuarioDoPerfil(usuarioId: number, perfilId: string) {
  try {
    const perfil = await prisma.perfil.update({
      data: {
        usuarioId,
      },
      where: {
        id: perfilId
      }
    });
    
    return perfil;
  } catch (error) {
    return null
  }  
}