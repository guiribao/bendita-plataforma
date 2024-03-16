import { prisma } from '~/secure/db.server';

export default async function deletarEventoPorId(eventoId: number) {
  try {
    await prisma.eventos.delete({
      where: { id: eventoId },
    });

  } catch (error) {
    console.log(error)
    return null
  }
}
