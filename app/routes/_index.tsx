import { LinksFunction, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect, useRef } from 'react';

import { authenticator } from '~/secure/authentication.server';

import siteStyle from '~/assets/css/site.css';
import indexHomeStyle from '~/assets/css/index-home.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: siteStyle },
  { rel: 'stylesheet', href: indexHomeStyle },
];

export const meta: MetaFunction = () => {
  return [
    { title: 'Bendita Canábica - Associação Espiritual' },
    {
      name: 'description',
      content: 'Conheça a história e os serviços da Associação Bendita Canábica. Faça parte de uma comunidade dedicada ao trabalho espiritual e bem-estar.',
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
    <main className='inicial'>
      {/* ===== HERO SECTION ===== */}
      <section className='hero-section'>
        <div className='hero-overlay' />
        <div className='container'>
          <div className='hero-content'>
            <h1 className='hero-title'>
              Seu Bem-estar,<br />Nossa Prioridade
            </h1>
            <p className='hero-subtitle'>
              Plataforma completa para <strong>gestão de saúde</strong>, medicações e
              <strong> conformidade legal</strong>. Conecte-se com profissionais e
              comunidade responsável.
            </p>
            <div className='hero-cta'>
              {usuario ? (
                <>
                  <Link to='/app/dashboard' className='btn-hero-primary'>
                    → Ir para Dashboard
                  </Link>
                  <Link to='/app/gente' className='btn-hero-secondary'>
                    Meus Associados
                  </Link>
                </>
              ) : (
                <>
                  <Link to='/cadastro' className='btn-hero-primary'>
                    ✨ Começar Agora
                  </Link>
                  <a href='#servicos' className='btn-hero-secondary'>
                    Explorar Plataforma
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA EXPLORAR SERVIÇOS ===== */}
      <section className='cta-servicos'>
        <div className='container'>
          <h2>Conheça Nossa Plataforma de Gestão</h2>
          <p>
            Sistema completo para gestão de associados, documentação de saúde,
            controle de remessas e conformidade legal. Tudo em um só lugar.
          </p>
          {usuario ? (
            <Link to='/app/gente' className='btn-cta-servicos'>
              🚀 Acessar Associados
            </Link>
          ) : (
            <a href='#servicos' className='btn-cta-servicos'>
              📚 Ver Funcionalidades
            </a>
          )}
        </div>
      </section>

      {/* ===== CTA FALE CONOSCO ===== */}
      <section className='cta-contato'>
        <div className='container'>
          <h2>Dúvidas? Vamos Conversar!</h2>
          <p>
            Nosso time está disponível 24/7 para ajudá-lo com qualquer pergunta sobre
            a plataforma, serviços ou como começar sua jornada de bem-estar.
          </p>
          <div className='cta-contato-buttons'>
            <Link to='/contato' className='btn-cta-contato-primary'>
              💬 Enviar Mensagem
            </Link>
            <a href='tel:+5511999999999' className='btn-cta-contato-secondary'>
              📞 Ligar
            </a>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className='stats-section'>
        <div className='container'>
          <div className='stats-grid'>
            <div className='stat-item'>
              <div className='stat-number'>+500</div>
              <div className='stat-label'>Associados Ativos</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>24/7</div>
              <div className='stat-label'>Suporte Disponível</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>100%</div>
              <div className='stat-label'>Segurança de Dados</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>50+</div>
              <div className='stat-label'>Profissionais</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVIÇOS DESTAQUE ===== */}
      <section id='servicos' className='servicos-destaque'>
        <div className='container'>
          <h2 className='section-title'>Recursos Principais</h2>
          <p className='section-subtitle'>
            Gestão completa do processo associativo com conformidade legal e suporte especializado
          </p>

          <div className='servicos-grid'>
            <div className='servico-card'>
              <div className='servico-icon'>📋</div>
              <h3>Gestão de Cadastros</h3>
              <p>
                Sistema completo para cadastro de associados, documentação de saúde,
                receitas médicas e autorizações ANVISA. Tudo organizado e seguro.
              </p>
              <a href='#' className='servico-link'>
                Descobrir →
              </a>
            </div>

            <div className='servico-card'>
              <div className='servico-icon'>🩺</div>
              <h3>Acompanhamento de Saúde</h3>
              <p>
                Registro de informações médicas, acompanhamento com prescritores,
                quadro geral de saúde e histórico de medicações controladas.
              </p>
              <a href='#' className='servico-link'>
                Descobrir →
              </a>
            </div>

            <div className='servico-card'>
              <div className='servico-icon'>📦</div>
              <h3>Gestão de Remessas</h3>
              <p>
                Controle de disponibilização de remessas para associados, com
                rastreamento, documentação e conformidade regulatória completa.
              </p>
              <a href='#' className='servico-link'>
                Descobrir →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BENEFÍCIOS SECTION ===== */}
      <section className='beneficios-section'>
        <div className='container'>
          <h2 className='section-title'>Benefícios para Você</h2>
          <p className='section-subtitle'>
            Associação organizada e transparente
          </p>

          <div className='beneficios-grid'>
            <div className='beneficio-item'>
              <div className='beneficio-numero'>01</div>
              <h3>Documentação Centralizada</h3>
              <p>
                Todos os documentos necessários em um só lugar: identidade, comprovante
                de residência, receitas médicas e autorizações ANVISA.
              </p>
            </div>

            <div className='beneficio-item'>
              <div className='beneficio-numero'>02</div>
              <h3>Registro de Saúde</h3>
              <p>
                Histórico completo de informações médicas, medicações controladas,
                prescritores e CRM para conformidade total.
              </p>
            </div>

            <div className='beneficio-item'>
              <div className='beneficio-numero'>03</div>
              <h3>Gestão de Responsáveis</h3>
              <p>
                Sistema de cadastro de responsáveis legais para menores de idade ou
                dependentes que necessitam de acompanhamento.
              </p>
            </div>

            <div className='beneficio-item'>
              <div className='beneficio-numero'>04</div>
              <h3>Processo Transparente</h3>
              <p>
                Acompanhe o status da sua associação em tempo real: aguardando cadastro,
                documentação, aprovação ou ativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className='features-section'>
        <div className='container'>
          <h2 className='section-title'>Funcionalidades da Plataforma</h2>
          <p className='section-subtitle'>Recursos desenvolvidos para a gestão associativa</p>

          <div className='features-grid'>
            <div className='feature-item'>
              <div className='feature-icon'>📄</div>
              <div className='feature-content'>
                <h4>Upload de Documentos</h4>
                <p>Sistema de upload para documentos pessoais, receitas e autorizações.</p>
              </div>
            </div>

            <div className='feature-item'>
              <div className='feature-icon'>👥</div>
              <div className='feature-content'>
                <h4>Gestão de Perfis</h4>
                <p>Cadastro completo de associados, dependentes e responsáveis legais.</p>
              </div>
            </div>

            <div className='feature-item'>
              <div className='feature-icon'>📊</div>
              <div className='feature-content'>
                <h4>Relatórios em PDF</h4>
                <p>Exportação de dados dos associados em formato PDF para documentação.</p>
              </div>
            </div>

            <div className='feature-item'>
              <div className='feature-icon'>🔐</div>
              <div className='feature-content'>
                <h4>Controle de Acesso</h4>
                <p>Sistema de permissões com diferentes papéis: Admin, Secretaria, Saúde.</p>
              </div>
            </div>

            <div className='feature-item'>
              <div className='feature-icon'>📦</div>
              <div className='feature-content'>
                <h4>Controle de Remessas</h4>
                <p>Gestão de disponibilização de remessas com limite de quantidade e valores.</p>
              </div>
            </div>

            <div className='feature-item'>
              <div className='feature-icon'>💰</div>
              <div className='feature-content'>
                <h4>Tarifa Social</h4>
                <p>Sistema de elegibilidade para tarifa social conforme critérios definidos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className='cta-final' style={{ paddingTop: '40px', paddingBottom: '20px' }}>
        <div className='container'>
          <div className='cta-content'>
            <h2>Faça Parte da Associação Bendita</h2>
            <p>
              Plataforma de gestão completa para associados com foco em conformidade
              legal, documentação organizada e processo transparente.
            </p>
            <div className='cta-buttons'>
              {usuario ? (
                <>
                  <Link to='/app/dashboard' className='btn-cta-primary'>
                    Acessar Plataforma
                  </Link>
                  <a href='#servicos' className='btn-cta-secondary'>
                    Ver Recursos
                  </a>
                </>
              ) : (
                <>
                  <Link to='/cadastro' className='btn-cta-primary'>
                    Iniciar Cadastro
                  </Link>
                  <Link to='/sobre' className='btn-cta-secondary'>
                    Conhecer a Associação
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
