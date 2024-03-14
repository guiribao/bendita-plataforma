import { prisma } from '~/secure/db.server';
import addHours from 'date-fns/addHours';

const VALIDADE_EMAIL_PADRAO = Number(process.env.VALIDADE_EMAIL_PADRAO)

export default async function criarTokenEsqueciSenha(usuarioId: number) {
  let agoraMais10h = addHours(new Date(), VALIDADE_EMAIL_PADRAO);
  
  try {
    const tokenCriado = await prisma.usuario_Esqueci_Senha.create({
      data: {
        usuarioId: usuarioId,
        valido_ate: agoraMais10h,
      },
    });

    if (!tokenCriado) {
      return null;
    }

    return tokenCriado;
  } catch (error) {
    return null;
  }
}
