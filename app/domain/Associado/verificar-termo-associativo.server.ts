import { Papel } from '@prisma/client';
import { redirect } from '@remix-run/node';
import { prisma } from '~/secure/db.server';

interface UsuarioSessao {
  id: number;
  papel: Papel;
}

/**
 * Verifica se o usuário é um associado responsável que ainda não aceitou o termo
 * Se sim, redireciona para a página do termo
 * Se não, retorna null (não redireciona)
 */
export async function verificarTermoAssociativo(usuario: UsuarioSessao, requestUrl: string) {
  // Se não é associado responsável, não precisa verificar
  if (usuario.papel !== Papel.ASSOCIADO) {
    return null;
  }

  // Se já está na página do termo, não redireciona
  if (requestUrl.includes('/app/termo-associativo')) {
    return null;
  }

  // Buscar perfil e associação
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      Associacao: true,
    },
  });

  // Se não tem perfil ou não é associado, não verifica
  if (!perfil?.Associacao) {
    return null;
  }

  // Se ainda não aceitou o termo, redireciona
  if (!perfil.Associacao.de_acordo_termo_associativo) {
    throw redirect('/app/termo-associativo');
  }

  return null;
}
