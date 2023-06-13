import Perfil from '~/model/Perfil.server';
import { Perfil as PrismaPerfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function editarPerfil(perfil: Perfil): Promise<PrismaPerfil | null> {
  try {
    let perfilEditado = await prisma.perfil.upsert({
      where: {
        id: perfil.id,
      },
      update: {
        nome: perfil.nome,
        sobrenome: perfil.sobrenome,
        foto: perfil.foto,
        grupo: perfil.grupo,
        email: perfil.email,
        celular: perfil.celular,
        bio: perfil.bio,
        profissao: perfil.profissao,
        membro: perfil.membro,
      },
      create: {
        nome: perfil.nome,
        sobrenome: perfil.sobrenome,
        foto: perfil.foto,
        grupo: perfil.grupo,
        email: perfil.email,
        celular: perfil.celular,
        bio: perfil.bio,
        profissao: perfil.profissao,
        membro: perfil.membro,
        usuarioId: perfil.usuarioId
      },
    });

    return perfilEditado;
  } catch (error) {
    return null;
  }
}
