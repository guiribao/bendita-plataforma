import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import pegarPerfilPeloIdUsuario from "~/domain/Perfil/perfil-pelo-id-usuario.server";

import { authenticator } from "~/secure/authentication.server";

import userImage from "~/assets/img/user.png";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let usuario = await authenticator.isAuthenticated(request);
  let perfil = null;

  if (usuario) perfil = await pegarPerfilPeloIdUsuario(usuario.id);

  return json({ usuario, perfil });
};

export default function Nav() {
  let { perfil, usuario } = useLoaderData();

  return (
    <div className="menu">
      <div className="menu-nav">
        <div className="menu-toggle">
          <i className="las la-bars"></i>
        </div>
        <ul className="menu-list">
          <li>
            <Link to="/sobre">Sobre</Link>
          </li>
          <li>
            <Link to="/servicos">Serviços</Link>
          </li>
          <li>
            <Link to="/conhecimento">Conhecimento</Link>
          </li>
          <li>
            <Link to="/contato">Contato</Link>
          </li>
        </ul>
      </div>

      {!usuario && (
        <div>
          <div className="menu-actions">
            <Link to="/cadastro/basico">Associe-se</Link>
            <Link to="/autentica/entrar">Entrar</Link>
          </div>
        </div>
      )}
      {usuario && perfil && (
        <div className="user-wrapper">
          <img
            src={userImage}
            alt="some random user image"
            width={"40px"}
            height={"40px"}
          />
          <div>
            <h6>
              {perfil?.nome
                ? `${perfil?.nome} ${perfil?.sobrenome}`
                : usuario?.email}
            </h6>
            <small>
              <Link to="/app/perfil">Meu perfil</Link>
              {" | "}
            </small>
            <small>
              <Link to="/autentica/sair">Sair</Link>
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
