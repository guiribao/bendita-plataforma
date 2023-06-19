import { useLocation } from '@remix-run/react';
import { ReactElement, useEffect } from 'react';

interface LayoutProps {
  children: ReactElement | ReactElement[]
}

export default function Layout({ children }: LayoutProps) {
  let location = useLocation();

  return <div className="container">
    {children}
  </div>;
}
