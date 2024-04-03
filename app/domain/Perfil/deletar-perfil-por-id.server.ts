import { prisma } from '~/secure/db.server';

export default async function deletarPerfilPorId(perfilId: number) {
  try {
    await prisma.perfil.delete({
      where: { id: perfilId },
    });

  } catch (error) {
    console.log(error)
    return null
  }
}
