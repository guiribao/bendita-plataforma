import { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Serviços - Associação Bendita Canábica' },
    { name: 'description', content: 'Conheça os serviços oferecidos pela Bendita' },
  ];
};

const services = [
  {
    id: 1,
    title: 'Profissionais Capacitados',
    icon: 'la-user-md',
    description: 'Rede de médicos e terapeutas especializados em cannabis medicinal com formação continuada.',
    features: ['Consultas especializadas', 'Acompanhamento contínuo', 'Prescrição personalizada'],
    color: '#8B4789',
  },
  {
    id: 2,
    title: 'Associação Medicinal',
    icon: 'la-cannabis',
    description: 'Plataforma completa para gestão de tratamento com cannabis medicinal de forma legal e segura.',
    features: ['Gestão digital', 'Suporte técnico', 'Orientação jurídica'],
    color: '#9932CC',
  },
  {
    id: 3,
    title: 'Associação Apoiadores',
    icon: 'la-hands-helping',
    description: 'Participe do movimento de democratização do acesso à saúde através da cannabis medicinal.',
    features: ['Comunidade ativa', 'Eventos exclusivos', 'Conteúdo educacional'],
    color: '#BA55D3',
  },
];

export default function Servicos() {
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  return (
    <main 
      className="servicos-container"
      style={{ 
        padding: '2rem 0',
        background: 'linear-gradient(155deg, #ffffff 0%, #faf7fc 18%, #f4f0f9 35%, #eee7f5 52%, #e7dcf1 68%, #dfd0ec 82%, #d6c2e7 95%, #cdb4e2 100%)',
      }}
    >
      {/* Efeito de orbes flutuantes */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-10%',
        width: '60%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(153, 50, 204, 0.09) 0%, rgba(153, 50, 204, 0.05) 35%, transparent 65%)',
        pointerEvents: 'none',
        animation: 'float 16s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-8%',
        width: '50%',
        height: '80%',
        background: 'radial-gradient(circle at center, rgba(153, 50, 204, 0.07) 0%, rgba(153, 50, 204, 0.03) 40%, transparent 65%)',
        pointerEvents: 'none',
        animation: 'float 20s ease-in-out infinite reverse',
      }} />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(25px, -25px) rotate(3deg); }
          66% { transform: translate(-15px, 15px) rotate(-3deg); }
        }

        @media (max-width: 767px) {
          .servicos-container {
            padding: 1rem 1rem 2rem 1rem !important;
          }
          .servicos-title {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            font-size: 1.75rem !important;
            text-align: left;
            padding: 1rem 1rem 0.5rem 1rem;
            margin-bottom: 0.5rem;
          }
          .servicos-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            padding: 0 0 2rem 0 !important;
          }
          .servicos-card {
            padding: 1.5rem !important;
          }
          .servicos-icon-container {
            width: 60px !important;
            height: 60px !important;
            margin-bottom: 1rem !important;
          }
          .servicos-icon {
            font-size: 2rem !important;
          }
          .servicos-card-title {
            font-size: 1.25rem !important;
          }
          .servicos-card-description {
            font-size: 0.9rem !important;
          }
          .servicos-feature {
            font-size: 0.85rem !important;
          }
          .servicos-cta {
            padding: 0.85rem 1.25rem !important;
            font-size: 0.9rem !important;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .servicos-title {
            font-size: 2.2rem !important;
            left: 2rem !important;
          }
          .servicos-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem !important;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .servicos-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>

      {/* Title */}
      <div className="servicos-title" style={{
        position: 'relative',
        paddingTop: '1.5rem',
        paddingLeft: '100px',
        paddingRight: '2rem',
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: '2.8rem', color: 'darkorchid', fontWeight: 'bold', margin: 0 }}>
          Nossos Serviços
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2%',
        overflow: 'visible',
      }}>
        {/* Services Grid */}
        <div className="servicos-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2.5rem',
          width: '100%',
          maxWidth: '1400px',
        }}>
          {services.map((service) => (
            <div
              key={service.id}
              className="servicos-card"
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '2.5rem 2rem',
                borderRadius: '20px',
                background: hoveredService === service.id 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.85) 100%)',
                border: `3px solid ${hoveredService === service.id ? service.color : 'rgba(153, 50, 204, 0.2)'}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredService === service.id ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
                cursor: 'pointer',
                boxShadow: hoveredService === service.id 
                  ? `0 20px 50px ${service.color}30, 0 10px 25px rgba(0, 0, 0, 0.1)`
                  : '0 8px 20px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden',
              }}
            >
              {/* Decorative Corner */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: `linear-gradient(135deg, ${service.color}15 0%, transparent 100%)`,
                borderRadius: '0 20px 0 100%',
                transition: 'all 0.4s ease',
                opacity: hoveredService === service.id ? 1 : 0.5,
              }} />

              {/* Icon Container */}
              <div className="servicos-icon-container" style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                background: hoveredService === service.id
                  ? `linear-gradient(135deg, ${service.color} 0%, darkorchid 100%)`
                  : `linear-gradient(135deg, ${service.color}20 0%, ${service.color}10 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: hoveredService === service.id 
                  ? `0 10px 30px ${service.color}40`
                  : '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}>
                <i 
                  className={`la ${service.icon} servicos-icon`}
                  style={{
                    fontSize: '2.5rem',
                    color: hoveredService === service.id ? 'white' : service.color,
                    transition: 'all 0.4s ease',
                  }}
                />
              </div>

              {/* Title */}
              <h3 className="servicos-card-title" style={{
                color: service.color,
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 0 1rem 0',
                letterSpacing: '0.3px',
                lineHeight: '1.3',
              }}>
                {service.title}
              </h3>

              {/* Description */}
              <p className="servicos-card-description" style={{
                color: '#555',
                fontSize: '0.95rem',
                lineHeight: '1.7',
                margin: '0 0 1.5rem 0',
                fontWeight: '500',
                flex: 1,
              }}>
                {service.description}
              </p>

              {/* Features List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}>
                {service.features.map((feature, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <i 
                      className="la la-check-circle"
                      style={{
                        fontSize: '1.1rem',
                        color: service.color,
                      }}
                    />
                    <span className="servicos-feature" style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      fontWeight: '600',
                    }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                to="/cadastro/basico"
                className="servicos-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  background: hoveredService === service.id
                    ? `linear-gradient(135deg, ${service.color} 0%, darkorchid 100%)`
                    : service.color,
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: hoveredService === service.id 
                    ? `0 8px 20px ${service.color}40`
                    : 'none',
                }}
              >
                Começar Agora
                <i className="la la-arrow-right" style={{ fontSize: '1.1rem' }} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
