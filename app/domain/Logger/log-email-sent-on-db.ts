import { TipoLogger } from '@prisma/client';
import { prisma } from '~/secure/db.server';

export async function logEmailSentOnDb(info) {
  try {
    await prisma.logger.create({
      data: {
        tipo_log: TipoLogger.EMAIL,
        log: JSON.stringify(info),
      },
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}
