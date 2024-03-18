import { prisma } from '~/secure/db.server';
import { encrypt } from '~/shared/Password.util'

export default async function atualizarUsuarioDoPerfil(usuarioId: number, perfilId: number) {
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