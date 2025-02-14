import { Papel } from '@prisma/client';

export const PaginasAbertas = [
  '/autentica/entrar',
  '/autentica/cadastro',
  '/autentica/senha',
  '/autentica/sair',
  '/perfil',
  '/perfil/editar',
  '/cadastro',
  '/em_breve',
  "/",
  "/sobre",
  "servicos",
  "conhecimento",
  "contato"
];

export const PaginaComPapelAdicional = ['/calendario/feira'];

export const PaginasPorPapel = {
  '/autorizacao': [Papel.USUARIO, Papel.ADMIN],
  '/perfil': [Papel.USUARIO, Papel.ADMIN],
  '/dashboard': [Papel.USUARIO, Papel.ADMIN],
  '/calendario': [Papel.USUARIO, Papel.ADMIN],
  '/calendario/novo': [Papel.ADMIN],
  '/calendario/feira/{id}': [Papel.ADMIN, Papel.USUARIO],
  '/calendario/{id}': [Papel.ADMIN, Papel.USUARIO],
  '/feira/{id}/feirante/{id}': [Papel.ADMIN],
  '/financeiro': [Papel.ADMIN],
  '/financeiro/novo': [Papel.ADMIN],
  '/financeiro/{id}': [Papel.ADMIN],
  '/gente': [Papel.ADMIN],
  '/gente/{id}': [Papel.ADMIN],
};

export const FuncionalidadesPorPapel = {
  '/dashboard': {
    MINICARDS_ADM: [Papel.ADMIN],
    ULTIMOS_PERFIS: [Papel.USUARIO, Papel.ADMIN],
    ULTIMAS_OPERACOES: [Papel.ADMIN],
    PROXIMOS_EVENTOS: [Papel.USUARIO, Papel.ADMIN],
  },
  '/calendario': {
    CRIAR_EVENTO: [Papel.ADMIN],
    DELETAR_EVENTO: [Papel.ADMIN],
    EDITAR_EVENTO: [Papel.ADMIN],
    CARDS_FEIRANTE: [Papel.FEIRANTE],
    FEIRANTE_VENDA: [Papel.FEIRANTE],
    FEIRANTE_CONFIGURACAO: [Papel.FEIRANTE],
    FEIRANTE_EXTRATO: [Papel.FEIRANTE]
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
