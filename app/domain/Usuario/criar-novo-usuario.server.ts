import bcrypt from 'bcryptjs';
import { prisma } from '~/secure/db.server';
import { encrypt } from '~/shared/Password.util'

export default async function criarNovoUsuario(email: string, senha: string) {
  const hash = await encrypt(senha)
  try {
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senha: hash,
      },
    });  
    return usuario;
  } catch (error) {
    return null
  }  
}