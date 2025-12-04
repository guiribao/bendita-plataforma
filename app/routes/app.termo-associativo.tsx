//@ts-nocheck
import { Papel } from '@prisma/client';
import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form as BootstrapForm, Row } from 'react-bootstrap';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { brDataFromIsoString } from '~/shared/DateTime.util';

export const meta: MetaFunction = () => {
  return [
    { title: 'Termo Associativo - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Termos e Condições de Uso do Associado',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Buscar perfil e associação
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      Associacao: true,
      usuario: true,
    },
  });

  if (!perfil) {
    throw new Response('Perfil não encontrado', { status: 404 });
  }

  // Se não é associado responsável, redireciona para dashboard
  if (usuario.papel !== Papel.ASSOCIADO) {
    return redirect('/app/dashboard');
  }

  // Se já aceitou o termo, redireciona para dashboard
  if (perfil.Associacao?.de_acordo_termo_associativo) {
    return redirect('/app/dashboard');
  }

  return json({ usuario, perfil });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const formData = await request.formData();
  const aceite = formData.get('aceite');

  if (!aceite) {
    return json({ error: 'Você precisa aceitar os termos para continuar' }, { status: 400 });
  }

  // Buscar perfil e associação
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      Associacao: true,
    },
  });

  if (!perfil?.Associacao) {
    return json({ error: 'Associação não encontrada' }, { status: 404 });
  }

  // Atualizar associação com aceite do termo
  await prisma.associado.update({
    where: { id: perfil.Associacao.id },
    data: {
      de_acordo_termo_associativo: true,
      de_acordo_termo_associativo_em: new Date(),
    },
  });

  return redirect('/app/dashboard');
}

export default function TermoAssociativo() {
  const { perfil } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [aceito, setAceito] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  console.log(perfil);

  return (
    <Container fluid className='min-vh-100 d-flex align-items-center justify-content-center bg-light py-5'>
      <Row className='w-100 justify-content-center'>
        <Col xs={12} lg={10} xl={9}>
          <Card className='shadow-lg border-0'>
            <Card.Header style={{ backgroundColor: 'darkorchid' }} className='text-white py-4'>
              <div className='text-center'>
                <h3 className='mb-1'>
                  <i className='las la-file-contract me-2' />
                  Termo Associativo
                </h3>
                <p className='mb-0 small'>Associação Bendita Canábica</p>
              </div>
            </Card.Header>

            <Card.Body className='p-4 p-md-5'>
              {actionData?.error && (
                <Alert variant='danger' className='mb-4'>
                  <i className='las la-exclamation-triangle me-2' />
                  {actionData.error}
                </Alert>
              )}

              <div className='mb-4 text-center'>
                <h4 className='text-uppercase fw-bold'>TERMOS E CONDIÇÕES DE USO DO ASSOCIADO</h4>
              </div>

              <div className='border rounded p-4 bg-white' style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <p className='mb-3'>
                  Eu, <strong>{perfil.nome_completo}</strong>, Nacionalidade <strong>{perfil.nacionalidade || '___________'}</strong>.
                  Estado Civil <strong>{perfil.estado_civil || '___________'}</strong>,
                  CPF n° <strong>{perfil.cpf || '___________'}</strong>,
                  RG n° <strong>{perfil.rg || '___________'}</strong>,
                  Residente na {perfil.endereco_rua ? `(Rua/Av.) ${perfil.endereco_rua}` : '___________'},
                  n° <strong>{perfil.endereco_numero || '___'}</strong>, Complemento <strong>{perfil.endereco_complemento || '___________'}</strong>, 
                  Bairro <strong>{perfil.endereco_bairro || '___________'}</strong>,
                  Cidade <strong>{perfil.endereco_cidade || '___________'}</strong>, UF <strong>{perfil.endereco_estado || '___'}</strong>,
                  Telefone <strong>{perfil.telefone || '___________'}</strong>,
                  E-mail <strong>{perfil.usuario.email}</strong>,
                  Redes sociais <strong>{perfil.redes_instagram || '___________'}</strong>, Representante legal de si mesmo ou do(a) associado(a)
                  {perfil.Associacao?.responsavelId && ' (nome do menor ou pet), se for o caso: ___________'},
                  na qualidade de associado(a) da Bendita Associação Canábica, declaro que estou de acordo com as normas de utilização dos serviços da Bendita Associação Canábica.
                </p>

                <p className='mb-3'>
                  O preenchimento do formulário do site, envio das documentações necessárias e o aceite deste termo, asseguram que você está se filiando à Bendita Associação Canábica, associação sem fins lucrativos, o que lhe permitirá solicitar os produtos fornecidos pela Associação, participar das ações e receber apoio, quando possível, sobre o tratamento, nas condições abaixo.
                </p>

                <p className='mb-3'>
                  Após o aceite deste termo de uso, você confirma que leu e está de acordo com as Normas de Utilização dos Serviços. Essas normas poderão ser alteradas a qualquer momento, a critério exclusivo da Bendita e estarão sempre disponíveis no website. Os associados entendem que este Instrumento tem a natureza jurídica de um contrato e concordam que o aceite implicará na vinculação aos seus termos e condições.
                </p>

                <p className='mb-3'>
                  Os associados adotam e anuem que a Bendita não presta serviços médicos, limitando-se na ajuda ao associado no acesso ao medicamento, e dentro das possibilidades, de tratamento condigno, sendo que todos os serviços prestados por médicos ou outros profissionais de classe da área de saúde ou correspondente, devidamente inscritos em seus órgãos de classe, que estão cadastrados nesta Associação, dão-se sem vínculo empregatício ou qualquer representação por parte da Associação, ficando sob a responsabilidade exclusiva de tais profissionais todas as informações relativas ao tratamento.
                </p>

                <p className='mb-3'>
                  O associado está ciente que não pode, em nenhuma hipótese, dividir, revender ou repassar seus produtos para terceiros, sob pena de desassociação imediata e responsabilização civil e criminal.
                </p>

                <p className='mb-3'>
                  Ao aceitar o contrato, o associado fica ciente que a Bendita poderá coletar informações sobre seu tratamento, perfil e outras características necessárias, para criação de um banco de dados para apresentação aos órgãos fiscalizadores, bem como para pesquisas.
                </p>

                <p className='mb-3'>
                  A Bendita se exime de qualquer responsabilidade por eventuais perdas, devoluções, roubos e outros sinistros com os envios dos produtos aos seus associados, ou mesmo que causem descompensação ou agravamento da enfermidade, não cabendo, em nenhuma hipótese, a responsabilização da Bendita. A Associação não se responsabilizará por impossibilidade de utilização da plataforma em caso de falta ou falha de conexão com a internet.
                </p>

                <p className='mb-3'>
                  O associado declara estar apto para o tratamento, descabendo a Bendita qualquer responsabilidade por eventual piora da enfermidade e/ou patologia que venha a acometê-lo em decorrência da utilização dos produtos, notadamente quando em desacordo com a prescrição médica.
                </p>

                <p className='mb-3'>
                  O contrato terá validade de 12 (doze) meses, podendo ser renovado ao final deste prazo, sempre com anuência das partes.
                </p>

                <p className='mb-3'>
                  O cancelamento poderá ser requerido pelo associado ou seu responsável a qualquer momento, porém, os valores pagos até o momento do pedido não serão reembolsados. Em hipótese alguma os valores ou o cadastro associativo poderá ser estendido à terceiros, por ser pessoal e intransferível.
                </p>

                <p className='mb-3'>
                  Os reembolsos que eventualmente forem feitos por mera liberalidade por parte da Bendita serão realizados por intermédio de depósito bancário, em nome do associado ou de seu responsável legal.
                </p>

                <p className='mb-3'>
                  Para realização da associação, faz-se necessário o encaminhamento da documentação necessária e informada previamente por intermédio do sítio eletrônico e/ou acolhedores, bem como o pagamento, por PIX ou no prazo do boleto emitido pela Bendita, da taxa associativa de R$ 50,00 (cinquenta reais) e a mensalidade do mês em curso no ato da associação, R$ 20,00. As demais mensalidades podem ser pagas mês a mês, programadamente, ou o associado pode optar pela anuidade no valor de R$ 240,00 (duzentos e quarenta reais) para humanos e para animais. Aderindo a este contrato, você autoriza a Bendita a solicitar pagamento de valores em aberto automaticamente, no PIX, boleto ou cartão de crédito. A autorização aqui concedida é irrevogável e terá validade enquanto existirem valores atrasados pelo associado, ainda que sua associação tenha sido cancelada e o contrato rescindido. (Chave PIX 55.841.491/0001) Banco Cora, agência 0001 Conta 5107933-6.
                </p>

                <p className='mb-3'>
                  A concordância ao presente Termo ocorrerá de forma eletrônica. O aderente manifesta sua ciência e aceite que a Bendita, no processo de adesão, efetuará coleta e armazenamento de suas informações pessoais, bem como de receita médica e relatório médico, necessários para a comprovação da patologia indicada, documentos pessoais e outros documentos que porventura venham a ser solicitados por determinação oficial.
                </p>

                <p className='mb-3'>
                  Os valores aqui indicados poderão ser reajustados a qualquer tempo pela associação, sempre com o aviso anterior de pelo menos 30 (trinta) dias e em razão da necessidade administrativa ou legal.
                </p>

                <p className='mb-3'>
                  As informações inseridas no sistema, ficarão sob a guarda de servidor de hospedagem que garanta qualidade e segurança contra acesso(s) não autorizado(s). A Bendita segue todas as medidas adequadas para proteção contra acesso, alteração, divulgação ou destruição não autorizada dos dados por ela armazenados. Essas medidas incluem análises internas de suas práticas de coleta, armazenamento e processamento de dados e medidas de segurança, incluindo criptografia e medidas físicas. A Bendita se reserva ao direito de manter, pelo prazo de 10 (dez) anos, todas as informações sobre seus associados em sistema não acessível por intermédio da rede mundial de computadores (internet), tudo com o escopo de prestar esclarecimentos aos órgãos fiscalizadores.
                </p>

                <p className='mb-3'>
                  Fica eleito o foro da Comarca de Porto Alegre para dirimir quaisquer divergências decorrentes do presente Termo de Adesão, excluídos outros, por mais privilegiados que sejam.
                </p>

                <div className='mt-4 p-3 bg-light border-start border-success border-4'>
                  <p className='mb-0 fw-bold'>
                    Declaro que li, estou ciente e de acordo com os Termos e Condições de Uso do Associado
                  </p>
                </div>
              </div>

              <Form method='post' className='mt-4'>
                <BootstrapForm.Group className='mb-4'>
                  <BootstrapForm.Check
                    type='checkbox'
                    id='aceite'
                    name='aceite'
                    checked={aceito}
                    onChange={(e) => setAceito(e.target.checked)}
                    label={
                      <span>
                        Li e aceito os <strong>Termos e Condições de Uso do Associado</strong>
                      </span>
                    }
                    className='fs-5'
                  />
                </BootstrapForm.Group>

                <div className='d-grid'>
                  <Button
                    type='submit'
                    variant='success'
                    size='lg'
                    disabled={!aceito || isSubmitting}
                    className='fw-bold'
                  >
                    {isSubmitting ? (
                      <>
                        <span className='spinner-border spinner-border-sm me-2' />
                        Processando...
                      </>
                    ) : (
                      <>
                        <i className='las la-check-circle me-2' />
                        Aceitar e Continuar
                      </>
                    )}
                  </Button>
                </div>

                <div className='text-center mt-3'>
                  <small className='text-muted'>
                    <i className='las la-info-circle me-1' />
                    Você precisa aceitar os termos para continuar utilizando a plataforma
                  </small>
                </div>
              </Form>
            </Card.Body>

            <Card.Footer className='text-muted text-center py-3 small'>
              <p className='mb-0'>
                Cidade e data: Porto Alegre, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
