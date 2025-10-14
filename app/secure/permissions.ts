import { Papel } from "@prisma/client";

export const PaginasAbertas = [
  "/autentica/entrar",
  "/autentica/cadastro",
  "/autentica/senha",
  "/autentica/sair",
  "/",
  "/sobre",
  "/servicos",
  "/conhecimento",
  "/contato",
];

export const PaginaComPapelAdicional = ["/calendario/feira"];

export const PaginasPorPapel = {
  "/app/autorizacao": [
    Papel.ASSOCIADO,
    Papel.ASSOCIADO_DEPENDENTE,
    Papel.SAUDE,
    Papel.SECRETARIA,
    Papel.ADMIN,
  ],
  "/app/perfil": [
    Papel.ASSOCIADO,
    Papel.ASSOCIADO_DEPENDENTE,
    Papel.SAUDE,
    Papel.SECRETARIA,
    Papel.ADMIN,
  ],
  "/app/dashboard": [
    Papel.ASSOCIADO,
    Papel.ASSOCIADO_DEPENDENTE,
    Papel.SAUDE,
    Papel.SECRETARIA,
    Papel.ADMIN,
  ],
  "/app/gente": [
    Papel.SAUDE,
    Papel.SECRETARIA,
    Papel.ADMIN,
  ],
  "/app/gente/{id}": [
    Papel.SAUDE,
    Papel.SECRETARIA,
    Papel.ADMIN,
  ],
};

export const FuncionalidadesPorPapel = {
  "/dashboard": {
    // MINICARDS_ADM: [Papel.ADMIN],
    // ULTIMOS_PERFIS: [Papel.USUARIO, Papel.ADMIN],
    // ULTIMAS_OPERACOES: [Papel.ADMIN],
    // PROXIMOS_EVENTOS: [Papel.USUARIO, Papel.ADMIN],
  },
  "/gente": {
    
  },
};
