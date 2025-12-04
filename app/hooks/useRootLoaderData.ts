import { useRouteLoaderData } from '@remix-run/react';

export function useRootLoaderData() {
  const rootData = useRouteLoaderData<any>('root');
  return {
    mensagensNaoLidas: rootData?.mensagensNaoLidas || 0,
    usuario: rootData?.usuario,
    perfil: rootData?.perfil,
    ENV: rootData?.ENV,
  };
}
