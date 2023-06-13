import { Authenticator, AuthorizationError } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import bcrypt from 'bcryptjs';

import { prisma } from './db.server';
import { sessionStorage } from './session.server';
import { Usuario as PrismaUsuario } from '@prisma/client';
import Usuario from '~/model/Usuario.server';

const authenticator = new Authenticator<Usuario>(sessionStorage);

const formStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get('email') as string;
  const senha = form.get('senha') as string;

  const usuario: PrismaUsuario | null = await prisma.usuario.findUnique({
    where: {
      email,
    },
  });

  if (!usuario) {
    console.warn('E-mail não cadastrado na base de dados');
    throw new AuthorizationError();
  }

  const passwordsMatch = await bcrypt.compare(senha, usuario.senha as string);

  if (!passwordsMatch) {
    throw new AuthorizationError();
  }

  return new Usuario(usuario)
});

authenticator.use(formStrategy, 'form');

export { authenticator };
