import { MetaFunction } from '@remix-run/node';
import { useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sobre - Associação Bendita Canábica' },
    { name: 'description', content: 'Conheça a história da Associação Bendita Canábica' },
  ];
};

const milestones = [
  { 
    year: 2020, 
    title: 'Fundação', 
    icon: 'la-seedling', 
    color: '#90EE90', 
    desc: 'Fundação da Bendita com propósito de democratizar acesso ao tratamento medicinal através de tecnologia e inovação.' 
  },
  { 
    year: 2021, 
    title: 'Crescimento', 
    icon: 'la-chart-line', 
    color: '#7BC67B', 
    desc: 'Primeiros 50 associados e estabelecimento de parcerias estratégicas com profissionais de saúde especializados.' 
  },
  { 
    year: 2022, 
    title: 'Expansão', 
    icon: 'la-network-wired', 
    color: '#228B22', 
    desc: 'Implementação de programas educacionais digitais e workshops especializados em cannabis medicinal.' 
  },
  { 
    year: 2023, 
    title: 'Impacto', 
    icon: 'la-award', 
    color: '#1a6a1a', 
    desc: 'Reconhecimento institucional e estabelecimento de parcerias universitárias para pesquisas científicas.' 
  },
  { 
    year: 2024, 
    title: 'Inovação', 
    icon: 'la-rocket', 
    color: '#0d3d0d', 
    desc: 'Lançamento de plataforma digital integrada com inteligência para gestão e atendimento aos associados.' 
  },
];

export default function Sobre() {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  return (
    <main className="sobre">
      <div style={{
        paddingTop: '2rem',
        paddingLeft: '100px',
        paddingRight: '2rem',
        marginBottom: '2rem',
      }}>
        <h1 style={{ fontSize: '2.8rem', color: 'darkorchid', fontWeight: 'bold', margin: 0 }}>
          Nossa Jornada
        </h1>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2% 4rem 2%',
      }}>
        {/* Timeline Container */}
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3rem',
        }}>
          {/* Timeline Line */}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Horizontal Line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              right: '5%',
              height: '3px',
              background: 'linear-gradient(90deg, rgba(153, 50, 204, 0.2) 0%, rgba(153, 50, 204, 0.6) 50%, rgba(153, 50, 204, 0.2) 100%)',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }} />

            {/* Milestones */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 5%',
              position: 'relative',
              zIndex: 2,
            }}>
              {milestones.map((milestone, idx) => (
                <div
                  key={milestone.year}
                  onMouseEnter={() => setHoveredYear(idx)}
                  onMouseLeave={() => setHoveredYear(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  {/* Icon Circle */}
                  <div style={{
                    width: hoveredYear === idx ? '90px' : '80px',
                    height: hoveredYear === idx ? '90px' : '80px',
                    borderRadius: '50%',
                    background: hoveredYear === idx 
                      ? `linear-gradient(135deg, ${milestone.color} 0%, darkorchid 100%)`
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                    border: hoveredYear === idx ? '4px solid darkorchid' : '3px solid rgba(153, 50, 204, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: hoveredYear === idx 
                      ? `0 12px 35px ${milestone.color}60, 0 0 0 8px rgba(153, 50, 204, 0.1)`
                      : '0 4px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredYear === idx ? 'translateY(-8px)' : 'translateY(0)',
                    position: 'relative',
                  }}>
                    <i 
                      className={`la ${milestone.icon}`}
                      style={{
                        fontSize: hoveredYear === idx ? '2.5rem' : '2rem',
                        color: hoveredYear === idx ? 'white' : 'darkorchid',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>

                  {/* Year & Title */}
                  <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      color: hoveredYear === idx ? 'darkorchid' : '#333',
                      letterSpacing: '0.5px',
                      transition: 'all 0.3s ease',
                    }}>
                      {milestone.year}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      marginTop: '0.3rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}>
                      {milestone.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description Card */}
          <div style={{
            minHeight: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {hoveredYear !== null && (
              <div style={{
                padding: '2rem 2.5rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                borderRadius: '16px',
                border: '2px solid darkorchid',
                boxShadow: '0 15px 40px rgba(153, 50, 204, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '900px',
                backdropFilter: 'blur(10px)',
                animation: 'slideUp 0.3s ease-out',
              }}>
                <style>{`
                  @keyframes slideUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}>
                  <i 
                    className={`la ${milestones[hoveredYear].icon}`}
                    style={{
                      fontSize: '2rem',
                      color: 'darkorchid',
                    }}
                  />
                  <h3 style={{
                    color: 'darkorchid',
                    fontSize: '1.5rem',
                    margin: 0,
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}>
                    {milestones[hoveredYear].year} — {milestones[hoveredYear].title}
                  </h3>
                </div>
                <p style={{
                  color: '#444',
                  fontSize: '1.05rem',
                  margin: 0,
                  lineHeight: '1.7',
                  fontWeight: '500',
                }}>
                  {milestones[hoveredYear].desc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
