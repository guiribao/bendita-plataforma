import { Papel } from '@prisma/client';
import Usuario from '~/model/Usuario.server';
import { prisma } from '~/secure/db.server';
import { encrypt } from '~/shared/Password.util'

export default async function criarNovoUsuario(email: string, senha: string, papel: Papel) {
  const hash = await encrypt(senha)
  try {
    const usuarioCriado = await prisma.usuario.create({
      data: {
        email,
        senha: hash,
        papel: papel
      },
    });

    return new Usuario(usuarioCriado);
  } catch (error) {
    return null
  }
}