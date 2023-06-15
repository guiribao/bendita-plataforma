import { prisma } from '~/secure/db.server';
import { encrypt } from '~/shared/Password.util'

export default async function atualizarSenhaUsuario(senha: string, usuarioId: number) {
  const hash = await encrypt(senha)
  try {
    const usuario = await prisma.usuario.update({
      data: {
        senha: hash,
      },
      where: {
        id: usuarioId
      }
    });
    
    return usuario;
  } catch (error) {
    return null
  }  
}