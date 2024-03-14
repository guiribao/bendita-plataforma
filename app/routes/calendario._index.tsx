import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import DeletingModal from '~/component/DeletingModal';
import pegarEventos from '~/domain/Calendario/pegar-eventos.server';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Calendário - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Gerenciamento de eventos do Chave',
    },
  ];
};

// export const action: ActionFunction = async ({ request }) => {
//   const form = await request.formData();
//   const action: string = form.get('_action') as string;
//   const operacaoId: number = Number(form.get('resource') as string);

//   if (action !== 'delete' && !operacaoId) return { success: false };

//   await deletarOperacaoPorId(operacaoId);

//   return { success: true };
// };

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Limit e offset - Paginação
  let eventos = await pegarEventos();

  return json({ eventos });
}

export default function CalendarioIndex() {
  const { eventos } = useLoaderData();

  // Dados para modal deletar item
  let [deleting, setDeleting] = useState(false);
  let [deletingItem, setDeletingItem] = useState({});

  function openDeletingModal(evento) {
    setDeleting(true);
    setDeletingItem(evento);
  }

  function closeDeletingModal() {
    setDeleting(false);
    setDeletingItem({});
  }

  return (
    <main>
      {deleting && (
        <DeletingModal item={deletingItem} close={closeDeletingModal} entity='calendario' />
      )}

      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <Link to={'/calendario/novo'}>+ Evento</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Nome</td>
                  <td>Descrição</td>
                  <td>Tipo de evento</td>
                  <td>Vestimenta</td>
                  <td>Data e hora</td>
                  <td>Criado em</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{evento.id}</td>
                    <td>{evento.titulo}</td>
                    <td>{evento.descricao}</td>
                    <td>{evento.tipo}</td>
                    <td>{evento.vestimenta}</td>
                    <td
                      title={format(new Date(evento.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(evento.data_hora), "d 'de' LLLL 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td
                      title={format(new Date(evento.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(evento.criado_em), "d 'de' LLLL 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td id='actions'>
                      <Link to={`/calendario/${evento.id}`}>
                        <i className='lar la-eye'></i>
                      </Link>
                      <Link to={`/calendario/${evento.id}/editar`}>
                        <i className='las la-pen'></i>
                      </Link>
                      <button onClick={() => openDeletingModal(evento)}>
                        <i className='las la-trash'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
