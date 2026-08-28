import { Form } from '@remix-run/react';

type DeletableItem = { id: string | number; eventoId?: string | number };
type Entity = keyof typeof endpointConfig;

const endpointConfig = {
  financeiro: { name: 'a Operação financeira', endpoint: '/financeiro' },
  calendario: { name: 'o Evento', endpoint: '/calendario' },
  gente: { name: 'o Perfil', endpoint: '/gente' },
  'financeiro feira': { name: 'a Venda na feira', endpoint: '/calendario/feira' },
} as const;

function DeletingModal({ item, close, entity }: { item: DeletableItem; close: () => void; entity: Entity }) {
  const endPointMatch = {
    financeiro: { ...endpointConfig.financeiro, id: item.id },
    calendario: { ...endpointConfig.calendario, id: item.id },
    gente: { ...endpointConfig.gente, id: item.id },
    'financeiro feira': { ...endpointConfig['financeiro feira'], id: item.id, endpoint: `/calendario/feira/${item.eventoId}` },
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    close();
    event.currentTarget.submit();
  }

  return (
    <div className='modal-container'>
      <div className='modal'>
        <div className='modal-header'>
          <h2>Excluir {entity}</h2>
        </div>
        <div className='modal-body'>
          <p>
            Você tem certeza que deseja excluir {endPointMatch[entity].name}: <br />
            <strong>#{String(endPointMatch[entity].id)}</strong>
          </p>
        </div>
        <div className='modal-footer'>
          <Form method='post' encType='multipart/form-data' action={endPointMatch[entity].endpoint} onSubmit={handleSubmit}>
            <input type='hidden' name='_action' value='delete' />
            <input type='hidden' name='resource' value={item.id} />
            <button type='submit' className='btnSim'>
              Sim
            </button>
            <button className='btnNao' onClick={() => close()}>
              Não
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default DeletingModal;
