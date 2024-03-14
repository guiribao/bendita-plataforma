import { Authenticator, AuthorizationError } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import { prisma } from './db.server';
import { sessionStorage } from './session.server';
import { Usuario as PrismaUsuario } from '@prisma/client';
import Usuario from '~/model/Usuario.server';
import { compare } from '~/shared/Password.util';

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
    throw new AuthorizationError('Ué?! Não encontrei nenhum usuário com este e-mail.');
  }

  const match = await compare(senha, usuario.senha as string);

  if (!match) {
    throw new AuthorizationError('Senha inválida para este usuário');
  }

  return new Usuario(usuario);
});

authenticator.use(formStrategy, 'form');

export { authenticator };
