import { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';

import siteStyle from '~/assets/css/site.css';
import indexHomeStyle from '~/assets/css/index-home.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: siteStyle },
  { rel: 'stylesheet', href: indexHomeStyle },
];

export const meta: MetaFunction = () => {
  return [
    { title: 'Bendita Canabica - Plataforma de Saude e Bem-estar' },
    {
      name: 'description',
      content: 'Plataforma de gestao associativa para saude, documentacao e conformidade legal.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return { usuario };
}

export default function Index() {
  const { usuario } = useLoaderData<typeof loader>();

  return (
    <main className='public-shell public-home'>
      <section className='public-hero'>
        <div className='public-container'>
          <div className='public-hero-grid'>
            <div>
              <div className='public-kicker'>Plataforma aplicacional</div>
              <h1 className='public-title'>
                Operacao associativa com <strong>seguranca</strong>, fluxo claro e dados confiaveis.
              </h1>
              <p className='public-lead'>
                Centralize cadastros, documentos e acompanhamento de saude em uma plataforma
                que prioriza conformidade legal, rastreabilidade e comunicacao com associados.
              </p>
              <div className='public-pill-group'>
                <span className='public-pill'>Controle de acesso</span>
                <span className='public-pill'>Documentacao segura</span>
                <span className='public-pill'>Fluxos padronizados</span>
              </div>
              <div className='public-actions'>
                {usuario ? (
                  <>
                    <Link to='/app/dashboard' className='public-btn'>
                      Ir para dashboard
                    </Link>
                    <Link to='/app/gente' className='public-btn-secondary'>
                      Ver associados
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to='/cadastro' className='public-btn'>
                      Comecar agora
                    </Link>
                    <a href='#servicos' className='public-btn-secondary'>
                      Explorar recursos
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className='public-hero-panel'>
              <div className='public-hero-panel-header'>
                <div className='public-hero-panel-title'>Painel operacional</div>
                <div className='public-hero-panel-status'>Status ativo</div>
              </div>
              <div className='public-hero-list'>
                <div className='public-hero-list-item'>
                  Associados ativos
                  <span>+500</span>
                </div>
                <div className='public-hero-list-item'>
                  Documentos auditados
                  <span>100%</span>
                </div>
                <div className='public-hero-list-item'>
                  SLA de atendimento
                  <span>24/7</span>
                </div>
              </div>
              <div className='public-hero-panel-footer'>
                <span className='public-hero-panel-tag'>Seguranca juridica</span>
                <span className='public-hero-panel-tag'>Historico medico</span>
                <span className='public-hero-panel-tag'>Relatorios claros</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='public-section'>
        <div className='public-container'>
          <div className='public-metrics'>
            <div className='public-metric'>
              <strong>+500</strong>
              <span>Associados ativos</span>
            </div>
            <div className='public-metric'>
              <strong>24/7</strong>
              <span>Suporte dedicado</span>
            </div>
            <div className='public-metric'>
              <strong>100%</strong>
              <span>Dados protegidos</span>
            </div>
            <div className='public-metric'>
              <strong>50+</strong>
              <span>Profissionais</span>
            </div>
          </div>
        </div>
      </section>

      <section id='servicos' className='public-section public-section--alt'>
        <div className='public-container'>
          <div className='public-section-head'>
            <h2 className='public-section-title'>Recursos que organizam a operacao</h2>
            <p className='public-section-subtitle'>
              Um fluxo completo para cadastro, documentos, acompanhamento clinico e remessas.
            </p>
          </div>
          <div className='public-grid public-grid-3'>
            <div className='public-card'>
              <div className='public-card-icon'>📋</div>
              <h3 className='public-card-title'>Gestao de cadastros</h3>
              <p className='public-card-text'>
                Dados de associados, dependentes e responsaveis organizados com revisao automatica.
              </p>
              <div className='public-pill-group'>
                <span className='public-pill'>Fluxo guiado</span>
                <span className='public-pill'>Checklist</span>
              </div>
            </div>
            <div className='public-card'>
              <div className='public-card-icon'>🩺</div>
              <h3 className='public-card-title'>Acompanhamento de saude</h3>
              <p className='public-card-text'>
                Historico medico, prescricoes e anexos clinicos reunidos em um unico painel.
              </p>
              <div className='public-pill-group'>
                <span className='public-pill'>Prontuario</span>
                <span className='public-pill'>Receitas</span>
              </div>
            </div>
            <div className='public-card'>
              <div className='public-card-icon'>📦</div>
              <h3 className='public-card-title'>Controle de remessas</h3>
              <p className='public-card-text'>
                Acompanhe disponibilidade, limites e documentacao regulatoria em tempo real.
              </p>
              <div className='public-pill-group'>
                <span className='public-pill'>Rastreio</span>
                <span className='public-pill'>Conformidade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='public-section'>
        <div className='public-container'>
          <div className='public-section-head'>
            <h2 className='public-section-title'>Processo claro do inicio ao fim</h2>
            <p className='public-section-subtitle'>
              Etapas padronizadas que garantem qualidade, auditoria e transparencia para os associados.
            </p>
          </div>
          <div className='home-process'>
            <div className='home-process-step'>
              <span>Etapa 1</span>
              <h4>Cadastro e validacao</h4>
              <p>Dados pessoais e documentos essenciais com validacao automatica.</p>
            </div>
            <div className='home-process-step'>
              <span>Etapa 2</span>
              <h4>Analise clinica</h4>
              <p>Receitas, prescritores e autorizacoes registradas com historico.</p>
            </div>
            <div className='home-process-step'>
              <span>Etapa 3</span>
              <h4>Gestao de remessas</h4>
              <p>Controle de disponibilidade, comunicacao e registros de entrega.</p>
            </div>
            <div className='home-process-step'>
              <span>Etapa 4</span>
              <h4>Relacionamento continuo</h4>
              <p>Acompanhamento e atendimento com indicadores claros.</p>
            </div>
          </div>
        </div>
      </section>

      <section className='public-section public-section--alt'>
        <div className='public-container'>
          <div className='public-section-head'>
            <h2 className='public-section-title'>Seguranca, governanca e confianca</h2>
            <p className='public-section-subtitle'>
              Estrutura pensada para operacoes sensiveis, com visibilidade por area e trilhas de auditoria.
            </p>
          </div>
          <div className='home-guard'>
            <div className='home-guard-item'>
              <div className='home-guard-icon'>🔐</div>
              <div className='home-guard-body'>
                <h4>Permissoes por papel</h4>
                <p>Admins, saude e secretaria com acessos definidos e revisaveis.</p>
              </div>
            </div>
            <div className='home-guard-item'>
              <div className='home-guard-icon'>🧾</div>
              <div className='home-guard-body'>
                <h4>Registro completo</h4>
                <p>Documentos e atualizacoes com rastreabilidade e historico centralizado.</p>
              </div>
            </div>
            <div className='home-guard-item'>
              <div className='home-guard-icon'>📊</div>
              <div className='home-guard-body'>
                <h4>Relatorios em PDF</h4>
                <p>Exportacao de dados com padrao institucional e pronta auditoria.</p>
              </div>
            </div>
          </div>
          <div className='home-cta-strip'>
            <strong>Pronto para consolidar a operacao em um so painel?</strong>
            {usuario ? (
              <Link to='/app/dashboard' className='public-btn'>
                Abrir plataforma
              </Link>
            ) : (
              <Link to='/cadastro' className='public-btn'>
                Iniciar cadastro
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className='public-section'>
        <div className='public-container'>
          <div className='public-cta-band'>
            <h3>Organize, acompanhe e mantenha conformidade com segurança.</h3>
            <p>Uma plataforma pensada para operacoes associativas modernas.</p>
            <div className='public-actions'>
              {usuario ? (
                <>
                  <Link to='/app/dashboard' className='public-btn-secondary'>
                    Acessar dashboard
                  </Link>
                  <Link to='/app/gente' className='public-btn'>
                    Ver associados
                  </Link>
                </>
              ) : (
                <>
                  <Link to='/cadastro' className='public-btn-secondary'>
                    Quero comecar
                  </Link>
                  <Link to='/sobre' className='public-btn'>
                    Conhecer a associacao
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
