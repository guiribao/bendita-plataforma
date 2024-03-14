import { prisma } from '~/secure/db.server';

export default async function desativarTokensEsqueciSenha(usuarioId: number) {
  try {
    return await prisma.usuario_Esqueci_Senha.updateMany({
      data: {
        ativo: false,
      },
      where: {
        usuarioId: usuarioId,
        ativo: true
      }
    });
  } catch (error) {
    console.warn(error);
  }
}
