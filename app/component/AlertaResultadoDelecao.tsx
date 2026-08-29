import { useSearchParams } from '@remix-run/react';
import { Alert } from 'react-bootstrap';

/**
 * Mostra o resultado de uma deleção que voltou pela URL (`?sucesso=` ou
 * `?erro=`). As rotas de deleção não têm componente próprio, então é aqui que a
 * mensagem aparece — sem isso, uma falha deixaria a tela em branco.
 */
export default function AlertaResultadoDelecao() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sucesso = searchParams.get('sucesso');
  const erro = searchParams.get('erro');

  if (!sucesso && !erro) return null;

  const limpar = () => {
    const novos = new URLSearchParams(searchParams);
    novos.delete('sucesso');
    novos.delete('erro');
    setSearchParams(novos, { replace: true, preventScrollReset: true });
  };

  return (
    <Alert variant={erro ? 'danger' : 'success'} dismissible onClose={limpar} className='mb-4 shadow-sm'>
      <i className={`las ${erro ? 'la-exclamation-triangle' : 'la-check-circle'} me-2`} />
      {erro ?? sucesso}
    </Alert>
  );
}
