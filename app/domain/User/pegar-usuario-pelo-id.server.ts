import { prisma } from '~/secure/db.server';
import { Usuario } from '@prisma/client';

export default async function pegarUsuarioPeloId(usuarioId: number): Promise<Usuario | null> {
  try {
    const usuario: {} | null = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    
    //@ts-ignore
    delete usuario.senha;

    return usuario as Usuario;
  } catch (error) {
    return null;
  }
}
