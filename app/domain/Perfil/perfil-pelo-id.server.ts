import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export default async function pegarPerfilPeloId(id: number): Promise<Perfil | null> {
  try {
    const perfil = await prisma.perfil.findUnique({
      where: {
        id
      }
    })
    
    return perfil;
  } catch (error) {
    console.log(error)
    return null
  }  
}