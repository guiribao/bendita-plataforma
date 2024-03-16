import { Papel } from '@prisma/client';

export const PaginasAbertas = [
  '/autentica/entrar',
  '/autentica/cadastro',
  '/autentica/senha',
  '/autentica/sair',
  '/perfil',
  '/perfil/editar'
]

export const PaginasPorPapel = {
  '/autorizacao': [Papel.USUARIO, Papel.ADMIN],
  '/perfil': [Papel.USUARIO, Papel.ADMIN],
  '/dashboard': [Papel.USUARIO, Papel.ADMIN],
  '/calendario': [Papel.USUARIO, Papel.ADMIN],
  '/calendario/novo': [Papel.ADMIN],
  '/calendario/{id}': [Papel.ADMIN],
  '/financeiro': [Papel.ADMIN],
  '/financeiro/novo': [Papel.ADMIN],
  '/financeiro/{id}': [Papel.ADMIN],
  '/gente': [Papel.USUARIO, Papel.ADMIN],
};

export const FuncionalidadesPorPapel = {
  '/dashboard': {
    CARDS_GENTE: [Papel.ADMIN],
    ULTIMOS_USUARIOS: [Papel.ADMIN],
    ULTIMAS_OPERACOES: [Papel.ADMIN],
    PROXIMOS_EVENTOS: [Papel.USUARIO, Papel.ADMIN],
  },
  '/calendario': {
    PROXIMOS_EVENTOS: [Papel.USUARIO, Papel.ADMIN],
    VISAO_CALENDARIO_MES: [Papel.USUARIO, Papel.ADMIN],
    VISAO_CALENDARIO_PASSADO: [Papel.ADMIN],
    CRIAR_EVENTO: [Papel.ADMIN],
  },
  '/financeiro': {
    CARDS_FINANCEIRO_MES: [Papel.ADMIN],
    OPERACOES_MES: [Papel.ADMIN],
    BUSCA_OPERACOES: [Papel.ADMIN],
  },
  '/gente': {
    CARDS_GENTE: [Papel.ADMIN],
    BUSCAR_PERFIL: [Papel.ADMIN],
    ULTIMOS_USUARIOS: [Papel.ADMIN],
    ULTIMOS_PERFIS: [Papel.ADMIN],
    BUSCAR_PROFISSIONAL: [Papel.USUARIO, Papel.ADMIN],
    CRIAR_PERFIL: [Papel.ADMIN],
  },
};
