import { Form } from '@remix-run/react';
import { Button } from 'react-bootstrap';

type Props = {
  /** Rota de deleção, ex.: `/app/documentos/123/deletar`. */
  action: string;
  /** Texto do confirm() — deve deixar claro o que mais vai junto. */
  confirmacao: string;
  titulo?: string;
  rotulo?: string;
  variant?: string;
  size?: 'sm' | 'lg';
  className?: string;
};

export default function BotaoDeletar({
  action,
  confirmacao,
  titulo = 'Deletar',
  rotulo,
  variant = 'outline-danger',
  size = 'sm',
  className,
}: Props) {
  return (
    <Form
      method='post'
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!confirm(confirmacao)) event.preventDefault();
      }}
    >
      <Button variant={variant} size={size} title={titulo} type='submit'>
        <i className='las la-trash' />
        {rotulo && <span className='ms-1'>{rotulo}</span>}
      </Button>
    </Form>
  );
}
