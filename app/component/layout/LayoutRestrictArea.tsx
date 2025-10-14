import { ReactElement } from "react";
import NavRestrictArea from "../NavRestrictArea";
import { Usuario } from "@prisma/client";

interface LayoutProps {
  children: ReactElement | ReactElement[];
  usuarioSistema: Usuario;
}

const LayoutRestrictArea = ({ children, usuarioSistema }: LayoutProps) => (
  <div className="plat-container">
    <NavRestrictArea role={usuarioSistema.papel} />
    {children}
  </div>
);

export default LayoutRestrictArea;
