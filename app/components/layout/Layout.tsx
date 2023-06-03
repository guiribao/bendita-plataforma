import { ReactElement } from 'react';

interface LayoutProps {
  children: ReactElement | ReactElement[]
}

export default function Layout({ children }: LayoutProps) {
  return <div className="container">
    {children}
  </div>;
}
