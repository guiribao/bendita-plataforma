import { Grupo, Perfil as PrismaPerfil } from '@prisma/client';
import Usuario from './Usuario.server';

export default class Perfil {
  id: number | undefined;
  nome: string;
  sobrenome: string;
  foto: string | null;
  grupo: Grupo;
  email: string;
  celular: string;
  bio: string | null;
  profissao: string | null;
  membro: boolean;
  usuarioId: number | null;
  criadoEm: Date | undefined;
  atualizadoEm: Date | undefined;

  constructor(
    nome: string,
    sobrenome: string,
    foto: string | null,
    grupo: string,
    email: string,
    celular: string,
    membro: boolean,
    profissao: string | null,
    bio: string | null,
    usuarioId: number | null,
    id: number | undefined,
    criadoEm: Date | undefined,
    atualizadoEm: Date | undefined
  ) {
    this.id = id;
    this.nome = nome;
    this.sobrenome = sobrenome;
    this.foto = foto || null;
    this.grupo = Grupo.FARDADO.includes(grupo) ? Grupo.FARDADO : Grupo.VISITANTE;
    this.email = email;
    this.celular = celular;
    this.bio = bio || null;
    this.profissao = profissao || null;
    this.membro = membro;
    this.usuarioId = usuarioId || null;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm

    if(!nome || !sobrenome || !email || !celular  ) throw new Error("Vish. Dá uma verificada nos campos obrigatórios")

    return this;
  }
}
