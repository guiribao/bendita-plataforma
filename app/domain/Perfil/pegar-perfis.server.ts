import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';
import { startOfDay } from 'date-fns';

export default async function pegarPerfis(): Promise<Perfil[] | null> {
  try {
    const hoje = startOfDay(new Date());
    
    return await prisma.perfil.findMany({
      include: { 
        usuario: {
          select: {
            id: true,
            email: true,
            papel: true,
            criado_em: true,
            atualizado_em: true,
          }
        },
        Associacao: {
          include: {
            Documentos: true,
            Pagamentos: {
              where: {
                proximo_vencimento: {
                  gte: hoje, // Pagamentos ainda não vencidos
                },
              },
              orderBy: {
                proximo_vencimento: 'desc',
              },
              take: 1, // Pega apenas o mais recente
            },
          }
        }
      },
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    return null;
  }
}
