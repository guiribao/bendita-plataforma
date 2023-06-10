import bcrypt from 'bcryptjs';
import { prisma } from '~/secure/db.server';

export default async function createNewUser(email: string, senha: string) {
  const salt = await bcrypt.genSalt(12);
  const senhaCriptografada = await bcrypt.hash(senha, salt);

  const usuario = await prisma.usuario.create({
    data: {
      email,
      senha: senhaCriptografada,
    },
  });

  return usuario;
}