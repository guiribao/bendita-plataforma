import { ReactElement } from "react";
import Footer from "../Footer";

interface LayoutProps {
  children: ReactElement | ReactElement[];
}

const Layout = ({ children }: LayoutProps) => (
  <div className="plat-container">
    {children}
    <Footer />
  </div>
);

export default Layout;
