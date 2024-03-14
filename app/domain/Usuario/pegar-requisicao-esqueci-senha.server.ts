import { prisma } from '~/secure/db.server';
import { Usuario_Esqueci_Senha } from '@prisma/client';

export default async function pegarRequisicaoEsqueciSenha(token: string): Promise<Usuario_Esqueci_Senha | null> {
  try {
    return await prisma.usuario_Esqueci_Senha.findFirst({
      where: { token },
    });
  } catch (error) {
    return null;
  }
}
