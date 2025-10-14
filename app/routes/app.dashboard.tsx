//@ts-nocheck
import { FinalidadeOperacao, Usuario } from "@prisma/client";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Breadcrumb, Col, Container, Row } from "react-bootstrap";
import { CurrencyInput } from "react-currency-mask";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import Minicards from "~/component/Minicards";
import pegarDadosEventosDashboard from "~/domain/Calendario/pegar-dados-eventos-dashboard.server";
import pegarDadosOperacoesDashboard from "~/domain/Financeiro/pegar-dados-operacoes-dashboard.server";
import pegarDadosPerfisDashboard from "~/domain/Perfil/pegar-dados-perfis-dashboard.server";
import { authenticator } from "~/secure/authentication.server";
import { gerarDescricaoOperacaoFeira } from "~/shared/Operacao.util";

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard  - Associação Bendita Canábica" },
    {
      name: "description",
      content: "Dashboard do app da Associação Bendita Canábica.",
    },
  ];
};

type UserLoaderDataType = {
  usuario: Usuario;
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  return json({ usuario });
}

const DashboardIndex = () => {
  const { usuario } = useLoaderData<UserLoaderDataType>();
  
  return (
    <LayoutRestrictArea usuarioSistema={usuario.papel}>
      {/* Criar componente layout area logado */}
      {/* Criar componente menu com opões dinamicas pela user role */}
      <Container>
        <Row>
          <Col>
            <h1>Dashboard</h1>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default DashboardIndex;
