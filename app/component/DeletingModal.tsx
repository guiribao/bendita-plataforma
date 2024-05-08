import { Form } from '@remix-run/react';

function DeletingModal({ item, close, entity }) {
  const endPointMatch = {
    financeiro: { id: item.id, name: 'a Operação financeira', endpoint: '/financeiro' },
    calendario: { id: item.id, name: 'o Evento', endpoint: '/calendario' },
    gente: { id: item.id, name: 'o Perfil', endpoint: '/gente' },
    "financeiro feira": { id: item.id, name: "a Venda na feira", endpoint: `/calendario/feira/${item.eventoId}`}
  };

  function handleSubmit(event) {
    close();
    event.target.submit();
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
            <strong>#{endPointMatch[entity].id}</strong>
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
