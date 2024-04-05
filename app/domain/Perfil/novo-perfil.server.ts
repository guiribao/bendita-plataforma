import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function novoPerfil(perfil): Promise<Perfil | null> {
  try {
    let perfilEditado = await prisma.perfil.create({
      data: {
        nome: perfil.nome,
        sobrenome: perfil.sobrenome,
        data_nascimento: new Date(perfil.data_nascimento).toISOString(),
        hora_nascimento: perfil.hora_nascimento || null,
        cidade_nascimento: perfil.cidade_nascimento || null,
        estado_nascimento: perfil.estado_nascimento || null,
        rg: perfil.registro_geral || null,
        cpf: perfil.cpf || null,
        foto: perfil.foto || null,
        email: perfil.email || null,
        telefone_fixo: perfil.telefone_fixo || null,
        celular: perfil.celular || null,
        bio: perfil.bio || null,
        profissao: perfil.profissao || null,
        grupo: perfil.grupo || null,
        data_fardamento: perfil.data_fardamento ? new Date(perfil.data_fardamento) : null,
        local_fardamento: perfil.local_fardamento || null,
        membro: perfil.membro || false,
        cep: perfil.cep || null,
        endereco: perfil.endereco || null,
        numero: perfil.numero || null,
        complemento: perfil.complemento || null,
        bairro: perfil.bairro || null,
        cidade: perfil.cidade || null,
        estado: perfil.estado || null,
        estado_civil: perfil.estado_civil || null,
        nome_conjuge: perfil.nome_conjuge || null,
        escolaridade: perfil.escolaridade || null,
        nome_referencia: perfil.nome_referencia || null,
        telefone_referencia: perfil.telefone_referencia || null,
        email_referencia: perfil.email_referencia || null,
        endereco_referencia: perfil.endereco_referencia || null,
        parentesco_referencia: perfil.parentesco_referencia || null,
        medicacao_controlada: perfil.medicacao_controlada,
        nome_medicacao: perfil.nome_medicacao || null,
        quadro_saude: perfil.quadro_saude || null,
        autorizacao_medico: perfil.autorizacao_medico,
        primeira_vez: perfil.primeira_vez,
        usuarioId: null,
      },
    });

    return perfilEditado;
  } catch (error) {
    console.log(error);

    return null;
  }
}
