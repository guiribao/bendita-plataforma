import { prisma } from '~/secure/db.server';

export default async function editarConfiguracoesBanca({ perfilId, nomeBanca, logoBanca, }) {
  try {
    let perfil = "";
    
    if (logoBanca) {
      perfil = await prisma.perfil.update({
        data: {
          nome_banca: nomeBanca,
          logo_banca: logoBanca
        },
        where: {
          id: perfilId
        }
      });
    } else {
      perfil = await prisma.perfil.update({
        data: {
          nome_banca: nomeBanca,
        },
        where: {
          id: perfilId
        }
      });
    }


    return perfil;
  } catch (error) {
    return null
  }
}