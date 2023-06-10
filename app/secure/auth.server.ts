import { Authenticator, AuthorizationError } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import bcrypt from 'bcryptjs';

import { prisma } from './db.server';
import { sessionStorage } from './session.server';
import { Usuario } from '@prisma/client';

const authenticator = new Authenticator(sessionStorage);

const formStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get('email') as string;
  const senha = form.get('senha') as string;

  const usuario: Usuario | null = await prisma.usuario.findFirst({
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

  return usuario;
});

authenticator.use(formStrategy, 'form');

export { authenticator };
