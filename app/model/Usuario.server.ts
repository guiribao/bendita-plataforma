import { Usuario as PrismaUsuario } from '@prisma/client';

export default class Usuario {
  id: number;
  email: string;
  criadoEm: Date;
  atualizadoEm: Date | null;
  papel: string;

  constructor(usuario: PrismaUsuario) {
    this.id = usuario.id
    this.email = usuario.email
    this.criadoEm = usuario.criado_em
    this.atualizadoEm = usuario.atualizado_em
    this.papel = usuario.papel

    return this
  }
}