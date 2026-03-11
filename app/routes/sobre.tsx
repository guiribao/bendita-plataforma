import { LinksFunction, MetaFunction } from '@remix-run/node';
import { useState } from 'react';
import siteStyle from '~/assets/css/site.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: siteStyle }];

export const meta: MetaFunction = () => {
  return [
    { title: 'Sobre - Associacao Bendita Canabica' },
    { name: 'description', content: 'Conheca a historia da Associacao Bendita Canabica' },
  ];
};

const milestones = [
  {
    year: 2020,
    title: 'Fundacao',
    desc: 'Inicio da associacao com foco em acesso seguro ao tratamento medicinal e orientacao profissional.',
  },
  {
    year: 2021,
    title: 'Crescimento',
    desc: 'Primeiros associados e parcerias estrategicas com profissionais de saude especializados.',
  },
  {
    year: 2022,
    title: 'Expansao',
    desc: 'Programas educacionais digitais e suporte estruturado para a comunidade.',
  },
  {
    year: 2023,
    title: 'Impacto',
    desc: 'Reconhecimento institucional e colaboracoes para pesquisa e desenvolvimento.',
  },
  {
    year: 2024,
    title: 'Inovacao',
    desc: 'Plataforma digital integrada para gestao, atendimento e conformidade regulatoria.',
  },
];

export default function Sobre() {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  return (
    <main className='public-shell public-about'>
      <section className='public-hero'>
        <div className='public-container'>
          <div>
            <div className='public-kicker'>Nossa jornada</div>
            <h1 className='public-title'>
              Historia de cuidado, organizacao e <strong>responsabilidade</strong>.
            </h1>
            <p className='public-lead'>
              A Bendita nasceu para apoiar associados com processos claros, documentacao segura e
              acesso confiavel a informacao e acompanhamento.
            </p>
          </div>
        </div>
      </section>

      <section className='public-section public-section--alt'>
        <div className='public-container'>
          <div className='public-section-head'>
            <h2 className='public-section-title'>Marcos importantes</h2>
            <p className='public-section-subtitle'>
              Uma evolucao constante para oferecer suporte profissional e infraestrutura digital.
            </p>
          </div>
          <div className='public-timeline'>
            {milestones.map((milestone, idx) => (
              <div
                key={milestone.year}
                className={`public-timeline-item ${hoveredYear === idx ? 'active' : ''}`}
                onMouseEnter={() => setHoveredYear(idx)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                <div className='public-timeline-year'>{milestone.year}</div>
                <div className='public-timeline-body'>
                  <h4>{milestone.title}</h4>
                  <p>{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='public-section'>
        <div className='public-container'>
          <div className='public-cta-band'>
            <h3>Quer conhecer a associacao mais de perto?</h3>
            <p>Estamos prontos para apoiar sua jornada com informacao e cuidado.</p>
            <div className='public-actions'>
              <a href='/contato' className='public-btn-secondary'>
                Falar com o time
              </a>
              <a href='/cadastro' className='public-btn'>
                Iniciar cadastro
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
