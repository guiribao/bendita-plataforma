import { Papel } from '@prisma/client';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { prisma } from '~/secure/db.server';

export async function action({ request }: ActionFunctionArgs) {
  let { path, perfilId } = await request.json();
  let roles = [];

  if (/\/calendario\/feira\/[0-9]/i.test(path)) {
    let aditionalRole = Papel.FEIRANTE;
    let urlParts = path.split('/');
    let eventoId = parseInt(urlParts[3]);

    let count = await prisma.evento_Feirante.count({
      where: {
        eventoId,
        perfilId,
      },
    });

    if (count) roles.push(aditionalRole);
  }

  return json({ roles });
}
