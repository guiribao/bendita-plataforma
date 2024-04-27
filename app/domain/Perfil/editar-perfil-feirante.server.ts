import { prisma } from '~/secure/db.server';

export default async function editarConfiguracoesBanca({  perfilId, nomeBanca, logoBanca, }) {
  try {
    const perfil = await prisma.perfil.update({
      data: {
        nome_banca: nomeBanca,
        logo_banca: logoBanca
      },
      where: {
        id: perfilId
      }
    });
    
    return perfil;
  } catch (error) {
    return null
  }  
}