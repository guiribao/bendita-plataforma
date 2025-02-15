import { Perfil } from '@prisma/client';
import { prisma } from '~/secure/db.server';
import { brStringToIsoString } from '~/shared/DateTime.util';

//@ts-ignore
export default async function criarPerfil(perfil): Promise<Perfil | null> {
  try {
    let perfilCriado = await prisma.perfil.create({
      data: {
        nome_completo: perfil.nomeCompleto,
        apelido: perfil.apelido,
        data_nascimento: perfil.dataNascimento,
        rg: perfil.rg,
        cpf: perfil.cpf,
        nacionalidade: perfil.nacionalidade,
        estado_civil: perfil.estadoCivil,
        sexo: perfil.sexo,
        telefone: perfil.telefone,
        cep: perfil.cep,
        endereco_rua: perfil.enderecoRua,
        endereco_numero: perfil.enderecoNumero,
        endereco_bairro: perfil.bairro,
        endereco_cidade: perfil.cidade,
        endereco_estado: perfil.estado,
        endereco_complemento: perfil.enderecoComplemento,
        usuarioId: perfil.usuarioId,
        redes_instagram: perfil.instagram,
        redes_linkedin: perfil.linkedin
      },
    });

    return perfilCriado;
  } catch (error) {
    console.log(error);
    return null;
  }
}
