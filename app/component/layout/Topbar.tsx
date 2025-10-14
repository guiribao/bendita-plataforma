import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { authenticator } from "~/secure/authentication.server";

import benditaLogo from "~/assets/img/logos/bendita_logo_horizontal_roxo.png";
import Nav from "../Nav";

export const loader = ({ request }: LoaderArgs) => {
  let usuario = authenticator.isAuthenticated(request);

  return json({ usuario });
};

const Topbar = () => (
  <header>
    <Link className="brand" to="/">
      <img src={benditaLogo} alt="Logo da bendita" />
    </Link>
    <Nav />
  </header>
);

export default Topbar;
