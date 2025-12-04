import { ActionFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { prisma } from '~/secure/db.server';
import { InputMaskClient } from '~/component/InputMaskClient';
import { Remetente } from '@prisma/client';

type ActionData = 
  | { errors: { geral?: string; nome?: string; email?: string; telefone?: string; texto?: string; aceiteArmazenamento?: string } }
  | { success: boolean; message: string };

function isSuccess(data: ActionData | undefined): data is { success: boolean; message: string } {
  return data !== undefined && 'success' in data;
}

function isErrors(data: ActionData | undefined): data is { errors: Record<string, string | undefined> } {
  return data !== undefined && 'errors' in data;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Contato - Associação Bendita Canábica' },
    { name: 'description', content: 'Entre em contato conosco' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ errors: { geral: 'Método não permitido.' } }, { status: 405 });
  }

  const formData = await request.formData();
  
  const nome = formData.get('nome') as string;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;
  const assunto = formData.get('assunto') as string;
  const texto = formData.get('texto') as string;
  const aceiteArmazenamento = formData.get('aceiteArmazenamento');

  const errors: any = {};

  if (!nome || nome.trim() === '') errors.nome = 'Nome é obrigatório';
  if (!email || email.trim() === '') errors.email = 'Email é obrigatório';
  if (!telefone || telefone.trim() === '') errors.telefone = 'Telefone é obrigatório';
  if (!texto || texto.trim() === '') errors.texto = 'Mensagem é obrigatória';
  if (!aceiteArmazenamento) errors.aceiteArmazenamento = 'Aceite é obrigatório';

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    let contato = await prisma.contato.findFirst({
      where: { 
        AND: [
          { email: email.trim() },
          { telefone: telefone.trim() },
        ]
      },
    });

    if (!contato) {
      try {
        // Tenta criar novo contato com email + telefone único
        contato = await prisma.contato.create({
          data: {
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
          },
        });
      } catch (createError: any) {
        // Se falhar por duplicação, atualiza o nome do existente
        if (createError?.code === 'P2002') {
          contato = await prisma.contato.findFirst({
            where: { 
              AND: [
                { email: email.trim() },
                { telefone: telefone.trim() },
              ]
            },
          });

          if (contato) {
            // Atualiza apenas o nome
            contato = await prisma.contato.update({
              where: { id: contato.id },
              data: {
                nome: nome.trim(),
              },
            });
          } else {
            throw new Error('Contato não encontrado após erro de duplicação');
          }
        } else {
          throw createError;
        }
      }
    } else {
      // Se encontrou contato existente, atualiza o nome
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
    <main 
      style={{ 
        padding: '2rem 0',
        background: 'linear-gradient(150deg, #ffffff 0%, #faf8fc 12%, #f5f2fa 25%, #efe9f6 40%, #e8dff2 55%, #e0d3ed 70%, #d7c6e8 83%, #cdb8e2 96%, #c3a9dc 100%)',
      }}
    >
      {/* Efeito de orbes de fundo */}
      <div style={{
        position: 'absolute',
        top: '-25%',
        right: '-12%',
        width: '55%',
        height: '90%',
        background: 'radial-gradient(ellipse at center, rgba(153, 50, 204, 0.07) 0%, rgba(153, 50, 204, 0.035) 35%, transparent 65%)',
        pointerEvents: 'none',
        animation: 'float 14s ease-in-out infinite',
        display: 'none',
      }} 
        className='d-none d-md-block'
      />
      <div style={{
        position: 'absolute',
        bottom: '-22%',
        left: '-10%',
        width: '52%',
        height: '85%',
        background: 'radial-gradient(circle at center, rgba(153, 50, 204, 0.06) 0%, rgba(153, 50, 204, 0.03) 38%, transparent 62%)',
        pointerEvents: 'none',
        animation: 'float 18s ease-in-out infinite reverse',
        display: 'none',
      }} 
        className='d-none d-md-block'
      />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(22px, -20px) rotate(2deg); }
          66% { transform: translate(-16px, 16px) rotate(-2deg); }
        }
        
        @media (max-width: 768px) {
          .contact-title-wrapper {
            position: static !important;
            text-align: center;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .contact-title-wrapper h1 {
            font-size: 1.75rem !important;
          }
        }
      `}</style>

      {/* Title Section */}
      <div style={{
        paddingTop: '2rem',
        paddingLeft: '100px',
        paddingRight: '2rem',
        marginBottom: '2rem',
      }}>
        <h1 style={{ fontSize: '2.8rem', color: 'darkorchid', fontWeight: 'bold', margin: 0 }}>
          Entre em Contato
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem 2% 3rem 2%',
      }}>
        {/* Form Card */}
        <div className="public-page-container" style={{
          maxWidth: '600px',
          width: '100%',
          flexDirection: 'column',
          padding: '0 1rem',
        }}>
          {'success' in (actionData || {}) && isSuccess(actionData) && (
            <div style={{
              padding: '1rem',
              background: 'rgba(34, 139, 34, 0.1)',
              border: '2px solid rgba(34, 139, 34, 0.3)',
              borderRadius: '12px',
              color: '#228B22',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '0.95rem',
              fontWeight: 'bold',
            }}>
              ✓ {actionData.message}
            </div>
          )}

          {isErrors(actionData) && actionData.errors?.geral && (
            <div style={{
              padding: '1rem',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '2px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              color: '#dc3545',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '0.95rem',
            }}>
              ✕ {actionData.errors.geral}
            </div>
          )}

          <Form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            {/* Nome */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: '#222', fontWeight: '700', fontSize: '1rem' }}>
                Nome <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="nome"
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: isErrors(actionData) && actionData.errors?.nome ? '2px solid red' : '2px solid rgba(153, 50, 204, 0.2)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(153, 50, 204, 0.02)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'darkorchid')}
                onBlur={(e) => (e.target.style.borderColor = isErrors(actionData) && actionData.errors?.nome ? 'red' : 'rgba(153, 50, 204, 0.2)')}
              />
              {isErrors(actionData) && actionData.errors?.nome && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.3rem', fontWeight: '600' }}>{actionData.errors.nome}</div>
              )}
            </div>

            {/* Email e Telefone em linha */}
            <div className='responsive-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', color: '#222', fontWeight: '700', fontSize: '1rem' }}>
                  Email <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: isErrors(actionData) && actionData.errors?.email ? '2px solid red' : '2px solid rgba(153, 50, 204, 0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(153, 50, 204, 0.02)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'darkorchid')}
                  onBlur={(e) => (e.target.style.borderColor = isErrors(actionData) && actionData.errors?.email ? 'red' : 'rgba(153, 50, 204, 0.2)')}
                />
                {isErrors(actionData) && actionData.errors?.email && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.3rem', fontWeight: '600' }}>{actionData.errors.email}</div>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', color: '#222', fontWeight: '700', fontSize: '1rem' }}>
                  Telefone <span style={{ color: 'red' }}>*</span>
                </label>
                <InputMaskClient
                  type="tel"
                  name="telefone"
                  required
                  mask="+55 (99) 9 9999-9999"
                  maskPlaceholder={"_"}
                  placeholder="(00) 9 0000-0000"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: isErrors(actionData) && actionData.errors?.telefone ? '2px solid red' : '2px solid rgba(153, 50, 204, 0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(153, 50, 204, 0.02)',
                  }}
                  onFocus={(e: any) => (e.currentTarget.style.borderColor = 'darkorchid')}
                  onBlur={(e: any) => (e.currentTarget.style.borderColor = isErrors(actionData) && actionData.errors?.telefone ? 'red' : 'rgba(153, 50, 204, 0.2)')}
                />
                {isErrors(actionData) && actionData.errors?.telefone && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.3rem', fontWeight: '600' }}>{actionData.errors.telefone}</div>
                )}
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: '#222', fontWeight: '700', fontSize: '1rem' }}>
                Assunto
              </label>
              <input
                type="text"
                name="assunto"
                placeholder="Opcional"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: '2px solid rgba(153, 50, 204, 0.2)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(153, 50, 204, 0.02)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'darkorchid')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(153, 50, 204, 0.2)')}
              />
            </div>

            {/* Mensagem */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: '#222', fontWeight: '700', fontSize: '1rem' }}>
                Mensagem <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="texto"
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  border: isErrors(actionData) && actionData.errors?.texto ? '2px solid red' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'darkorchid')}
                onBlur={(e) => (e.target.style.borderColor = isErrors(actionData) && actionData.errors?.texto ? 'red' : '#e0e0e0')}
              />
              {isErrors(actionData) && actionData.errors?.texto && (
                <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>{actionData.errors.texto}</div>
              )}
            </div>

            {/* Checkbox */}
            <div>
              <label style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  name="aceiteArmazenamento"
                  checked={aceite}
                  onChange={(e) => setAceite(e.target.checked)}
                  style={{ marginTop: '0.2rem', cursor: 'pointer', minWidth: '16px' }}
                />
                <span style={{ color: '#666' }}>
                  Concordo com armazenamento de dados <span style={{ color: 'red' }}>*</span>
                </span>
              </label>
              {isErrors(actionData) && actionData.errors?.aceiteArmazenamento && (
                <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {actionData.errors.aceiteArmazenamento}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '1rem',
                background: isSubmitting ? '#ccc' : 'darkorchid',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginTop: 'auto',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = '#7b2a9e';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = 'darkorchid';
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
