import type { ActionFunctionArgs, LinksFunction, MetaFunction} from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { prisma } from '~/secure/db.server';
import { InputMaskClient } from '~/component/InputMaskClient';
import { Remetente } from '@prisma/client';
import siteStyle from '~/assets/css/site.css';

type ActionData =
  | { errors: { geral?: string; nome?: string; email?: string; telefone?: string; texto?: string; aceiteArmazenamento?: string } }
  | { success: boolean; message: string };

function isSuccess(data: ActionData | undefined): data is { success: boolean; message: string } {
  return data !== undefined && 'success' in data;
}

function isErrors(data: ActionData | undefined): data is { errors: Record<string, string | undefined> } {
  return data !== undefined && 'errors' in data;
}

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: siteStyle }];

export const meta: MetaFunction = () => {
  return [
    { title: 'Contato - Associacao Bendita Canabica' },
    { name: 'description', content: 'Entre em contato conosco' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ errors: { geral: 'Metodo nao permitido.' } }, { status: 405 });
  }

  const formData = await request.formData();

  const nome = formData.get('nome') as string;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;
  const assunto = formData.get('assunto') as string;
  const texto = formData.get('texto') as string;
  const aceiteArmazenamento = formData.get('aceiteArmazenamento');

  const errors: any = {};

  if (!nome || nome.trim() === '') errors.nome = 'Nome e obrigatorio';
  if (!email || email.trim() === '') errors.email = 'Email e obrigatorio';
  if (!telefone || telefone.trim() === '') errors.telefone = 'Telefone e obrigatorio';
  if (!texto || texto.trim() === '') errors.texto = 'Mensagem e obrigatoria';
  if (!aceiteArmazenamento) errors.aceiteArmazenamento = 'Aceite e obrigatorio';

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    let contato = await prisma.contato.findFirst({
      where: {
        AND: [{ email: email.trim() }, { telefone: telefone.trim() }],
      },
    });

    if (!contato) {
      try {
        contato = await prisma.contato.create({
          data: {
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
          },
        });
      } catch (createError: any) {
        if (createError?.code === 'P2002') {
          contato = await prisma.contato.findFirst({
            where: {
              AND: [{ email: email.trim() }, { telefone: telefone.trim() }],
            },
          });

          if (contato) {
            contato = await prisma.contato.update({
              where: { id: contato.id },
              data: {
                nome: nome.trim(),
              },
            });
          } else {
            throw new Error('Contato nao encontrado apos erro de duplicacao');
          }
        } else {
          throw createError;
        }
      }
    } else {
      contato = await prisma.contato.update({
        where: { id: contato.id },
        data: {
          nome: nome.trim(),
        },
      });
    }

    await prisma.mensagem.create({
      data: {
        contatoId: contato.id,
        assunto: assunto?.trim() || null,
        texto: texto.trim(),
        remetente: Remetente.FROM_CONTACT,
      },
    });

    return json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar contato/mensagem:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return json({ errors: { geral: 'Erro ao enviar mensagem.' } }, { status: 500 });
  }
}

export default function Contato() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [aceite, setAceite] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  return (
    <main className='public-shell public-contact'>
      <section className='public-hero'>
        <div className='public-container'>
          <div>
            <div className='public-kicker'>Contato</div>
            <h1 className='public-title'>
              Fale com a <strong>Bendita</strong>.
            </h1>
            <p className='public-lead'>
              Nossa equipe responde rapidamente com orientacao, informacao e suporte.
            </p>
          </div>
        </div>
      </section>

      <section className='public-section public-section--alt'>
        <div className='public-container'>
          <div className='public-form-card'>
            {isSuccess(actionData) && (
              <div className='public-alert success'>✓ {actionData.message}</div>
            )}

            {isErrors(actionData) && actionData.errors?.geral && (
              <div className='public-alert error'>✕ {actionData.errors.geral}</div>
            )}

            <Form method='post' style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              <div>
                <label className='public-label'>
                  Nome <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type='text'
                  name='nome'
                  required
                  className={`public-input ${isErrors(actionData) && actionData.errors?.nome ? 'error' : ''}`}
                />
                {isErrors(actionData) && actionData.errors?.nome && (
                  <div className='public-hint'>{actionData.errors.nome}</div>
                )}
              </div>

              <div className='public-form-row'>
                <div>
                  <label className='public-label'>
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type='email'
                    name='email'
                    required
                    className={`public-input ${isErrors(actionData) && actionData.errors?.email ? 'error' : ''}`}
                  />
                  {isErrors(actionData) && actionData.errors?.email && (
                    <div className='public-hint'>{actionData.errors.email}</div>
                  )}
                </div>

                <div>
                  <label className='public-label'>
                    Telefone <span style={{ color: 'red' }}>*</span>
                  </label>
                  <InputMaskClient
                    type='tel'
                    name='telefone'
                    required
                    mask='+55 (99) 9 9999-9999'
                    maskPlaceholder={'_'}
                    placeholder='(00) 9 0000-0000'
                    className={`public-input ${isErrors(actionData) && actionData.errors?.telefone ? 'error' : ''}`}
                  />
                  {isErrors(actionData) && actionData.errors?.telefone && (
                    <div className='public-hint'>{actionData.errors.telefone}</div>
                  )}
                </div>
              </div>

              <div>
                <label className='public-label'>Assunto</label>
                <input type='text' name='assunto' placeholder='Opcional' className='public-input' />
              </div>

              <div>
                <label className='public-label'>
                  Mensagem <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  name='texto'
                  required
                  rows={4}
                  className={`public-textarea ${isErrors(actionData) && actionData.errors?.texto ? 'error' : ''}`}
                />
                {isErrors(actionData) && actionData.errors?.texto && (
                  <div className='public-hint'>{actionData.errors.texto}</div>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', gap: '0.6rem', cursor: 'pointer', color: '#5f5875' }}>
                  <input
                    type='checkbox'
                    name='aceiteArmazenamento'
                    checked={aceite}
                    onChange={(e) => setAceite(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  Concordo com armazenamento de dados <span style={{ color: 'red' }}>*</span>
                </label>
                {isErrors(actionData) && actionData.errors?.aceiteArmazenamento && (
                  <div className='public-hint'>{actionData.errors.aceiteArmazenamento}</div>
                )}
              </div>

              <button type='submit' className='public-btn' disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </Form>
          </div>
        </div>
      </section>
    </main>
  );
}
