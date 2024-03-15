import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';

//@ts-ignore
export default async function editarPerfil(perfil): Promise<Perfil | null> {
  try {
    let perfilEditado = await prisma.perfil.upsert({
      where: {
        id: perfil.id,
      },
      update: {
        primeiro_nome: perfil.primeiro_nome,
        ultimo_nome: perfil.ultimo_nome,
        data_hora_nascimento: perfil.data_hora_nascimento,
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
      },
      create: {
        primeiro_nome: perfil.primeiro_nome,
        ultimo_nome: perfil.ultimo_nome,
        data_hora_nascimento: perfil.data_hora_nascimento,
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
        usuarioId: perfil.usuarioId,
      },
    });

    return perfilEditado;
  } catch (error) {
    console.log(error);

    return null;
  }
}
