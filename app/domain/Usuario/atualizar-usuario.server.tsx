import { Papel, Usuario } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarUsuario(usuarioId: string, email: string, papel: Papel): Promise<Usuario | null> {
  try {
    let usuarioAtualizado = await prisma.usuario.update({
      where: {
        id: usuarioId,
      },
      data: {
        email,
        papel,
      },
    });

    return usuarioAtualizado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
