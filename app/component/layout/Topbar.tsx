import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import { authenticator } from "~/secure/authentication.server";

import logoHorizontalRoxo from "~/assets/img/logos/bendita_logo_horizontal_roxo.png";
import simboloRoxo from "~/assets/img/logos/bendita_símbolo_roxo.png";
import Nav from "../Nav";

export const loader = ({ request }: LoaderFunctionArgs) => {
  let usuario = authenticator.isAuthenticated(request);

  return json({ usuario });
};

const Topbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className='topbar-header'>
      <div className='topbar-brand'>
        <button 
          className='topbar-toggle' 
          onClick={toggleMobileMenu}
          aria-label='Abrir menu'
        >
          <i className='las la-bars'></i>
        </button>
        <Link className="brand" to="/" onClick={closeMobileMenu}>
          <img src={logoHorizontalRoxo} alt="Logo da bendita" className="logo-desktop" />
          <img src={simboloRoxo} alt="Bendita" className="logo-mobile" />
        </Link>
      </div>
      <Nav mobileMenuOpen={mobileMenuOpen} closeMobileMenu={closeMobileMenu} />
    </header>
  );
};

export default Topbar;

