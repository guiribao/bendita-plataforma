import { LinksFunction, MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { useState } from 'react';
import siteStyle from '~/assets/css/site.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: siteStyle }];

export const meta: MetaFunction = () => {
  return [
    { title: 'Servicos - Associacao Bendita Canabica' },
    { name: 'description', content: 'Conheca os servicos oferecidos pela Bendita' },
  ];
};

const services = [
  {
    id: 1,
    title: 'Profissionais capacitados',
    icon: 'la-user-md',
    description: 'Rede de medicos e terapeutas especializados com acompanhamento continuo.',
    features: ['Consultas especializadas', 'Acompanhamento continuo', 'Prescricao personalizada'],
    color: '#8B4789',
  },
  {
    id: 2,
    title: 'Associacao medicinal',
    icon: 'la-cannabis',
    description: 'Plataforma completa para gestao do tratamento com suporte tecnico e juridico.',
    features: ['Gestao digital', 'Suporte tecnico', 'Orientacao juridica'],
    color: '#9932CC',
  },
  {
    id: 3,
    title: 'Associacao apoiadores',
    icon: 'la-hands-helping',
    description: 'Comunidade ativa para quem apoia a democratizacao do acesso a saude.',
    features: ['Comunidade ativa', 'Eventos exclusivos', 'Conteudo educacional'],
    color: '#BA55D3',
  },
];

export default function Servicos() {
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  return (
    <main className='public-shell public-services'>
      <section className='public-hero'>
        <div className='public-container'>
          <div>
            <div className='public-kicker'>Servicos</div>
            <h1 className='public-title'>
              Uma plataforma completa para <strong>saude</strong>, suporte e gestao associativa.
            </h1>
            <p className='public-lead'>
              Organizacao profissional para atendimento medico, gestao de associados e suporte
              institucional com foco em conformidade.
            </p>
            <div className='public-actions'>
              <Link to='/cadastro' className='public-btn'>
                Fazer parte
              </Link>
              <Link to='/contato' className='public-btn-secondary'>
                Falar com o time
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='public-section public-section--alt'>
        <div className='public-container'>
          <div className='public-section-head'>
            <h2 className='public-section-title'>O que entregamos</h2>
            <p className='public-section-subtitle'>
              Cada servico foi pensado para apoiar a jornada do associado de forma segura e clara.
            </p>
          </div>
          <div className='public-grid public-grid-3'>
            {services.map((service) => (
              <div
                key={service.id}
                className='public-card'
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
                style={{ borderColor: hoveredService === service.id ? service.color : 'rgba(153, 50, 204, 0.15)' }}
              >
                <div className='public-card-icon' style={{ color: service.color, background: `${service.color}1F` }}>
                  <i className={`la ${service.icon}`} />
                </div>
                <h3 className='public-card-title' style={{ color: service.color }}>
                  {service.title}
                </h3>
                <p className='public-card-text'>{service.description}</p>
                <ul className='public-feature-list'>
                  {service.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='public-section'>
        <div className='public-container'>
          <div className='public-cta-band'>
            <h3>Vamos construir sua jornada com seguranca e acompanhamento.</h3>
            <p>Equipe pronta para orientar cada etapa do processo associativo.</p>
            <div className='public-actions'>
              <Link to='/cadastro' className='public-btn-secondary'>
                Iniciar cadastro
              </Link>
              <Link to='/contato' className='public-btn'>
                Agendar conversa
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
