import { Associado } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function atualizarSaudeAssociado(obj): Promise<Associado | null> {
  try {
    let associadoAtualizado = await prisma.associado.update({
      where: {
        id: obj.associadoId,
      },
      data: {
        saude_quadro_geral: obj.quadroGeral,
        saude_uso_medicacao: obj.usaMedicacao,
        saude_uso_medicacao_nome: obj.usaMedicacaoNome,
        saude_uso_terapeutico_canabis: obj.usoTerapeutico,
        saude_uso_terapeutico_canabis_experiencia: obj.usoTerapeuticoRelato,
        saude_medico_prescritor: obj.acompanhadoPrescritor,
        saude_medico_prescritor_nome: obj.acompanhadoPrescritorNome,
        saude_medico_prescritor_crm: obj.acompanhadoPrescritorCrm,
      },
    });

    return associadoAtualizado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
