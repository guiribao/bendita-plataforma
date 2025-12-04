import { MetaFunction } from '@remix-run/node';
import { useState, useEffect, useRef } from 'react';
import knowledgeBase from '~/data/knowledge-base.json';

export const meta: MetaFunction = () => {
  return [
    { title: 'Base de Conhecimento - Associação Bendita Canábica' },
    { name: 'description', content: 'Pesquisa científica sobre cannabis medicinal com referências reais' },
  ];
};

// Função para embaralhar todos os artigos
function shuffleArticles(allArticles: any[]) {
  return [...allArticles].sort(() => 0.5 - Math.random());
}

// Função para gerar tamanhos aleatórios para os cards (grid spans)
function generateRandomSizes(count: number) {
  const sizes = ['small', 'medium', 'large'];
  return Array.from({ length: count }, () => {
    const random = Math.random();
    if (random < 0.5) return 'small'; // 50% small (1x1)
    if (random < 0.85) return 'medium'; // 35% medium (2x1)
    return 'large'; // 15% large (2x2)
  });
}

// Função para gerar animações aleatórias (translação vertical sutil)
function generateRandomAnimations(count: number) {
  return Array.from({ length: count }, () => ({
    translateY: Math.random() * 10 - 5, // -5px a +5px
    duration: 3 + Math.random() * 3, // 3s a 6s
    delay: Math.random() * 2, // 0s a 2s
  }));
}

export default function Conhecimento() {
  const [articles, setArticles] = useState<any[]>([]);
  const [hoveredArticle, setHoveredArticle] = useState<number | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [animations, setAnimations] = useState<any[]>([]);
  const [visibleArticles, setVisibleArticles] = useState<any[]>([]);
  const [scrollPositions, setScrollPositions] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Carrega todos os artigos embaralhados ao montar componente
  useEffect(() => {
    const randomArticles = shuffleArticles(knowledgeBase.articles);
    setArticles(randomArticles);
    setSizes(generateRandomSizes(randomArticles.length));
    setAnimations(generateRandomAnimations(randomArticles.length));
    setScrollPositions(new Array(randomArticles.length).fill(0));
  }, []);

  // Animação de scroll automático
  useEffect(() => {
    if (visibleArticles.length === 0) return;

    let startTime = Date.now();
    const speeds = visibleArticles.map(() => 0.02 + Math.random() * 0.03); // Velocidade média variada

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - startTime;
      startTime = currentTime;

      setScrollPositions(prev => 
        prev.map((pos, index) => {
          if (hoveredArticle === visibleArticles[index]?.id) return pos; // Pausa no hover
          
          const speed = speeds[index] || 0.03;
          let newPos = pos + (speed * deltaTime);
          
          // Loop infinito: quando chegar em 100, volta para 0
          if (newPos >= 100) newPos = 0;
          
          return newPos;
        })
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visibleArticles, hoveredArticle]);

  // Calcula quantos cards cabem na tela
  useEffect(() => {
    if (articles.length === 0 || sizes.length === 0) return;

    const calculateVisibleCards = () => {
      if (!gridRef.current) {
        // Se o grid ainda não existe, use um timeout para tentar novamente
        setTimeout(calculateVisibleCards, 100);
        return;
      }

      const gridElement = gridRef.current;
      const containerHeight = gridElement.clientHeight;
      const containerWidth = gridElement.clientWidth;
      
      // Cada célula base tem 220px + 1.2rem de gap
      const cellSize = 220;
      const gap = 19.2; // 1.2rem em pixels (aproximado)
      
      // Calcula quantas colunas cabem
      const columns = Math.floor((containerWidth + gap) / (cellSize + gap));
      
      // Calcula quantas linhas cabem
      const rows = Math.floor((containerHeight + gap) / (cellSize + gap));
      
      // Filtra artigos que cabem no grid visível
      const visible: any[] = [];
      let currentRow = 0;
      let currentCol = 0;
      
      for (let i = 0; i < articles.length; i++) {
        const size = sizes[i];
        const colSpan = size === 'large' || size === 'medium' ? 2 : 1;
        const rowSpan = size === 'large' ? 2 : 1;
        
        // Verifica se o card cabe na linha atual
        if (currentCol + colSpan > columns) {
          currentCol = 0;
          currentRow++;
        }
        
        // Verifica se o card cabe na altura disponível
        if (currentRow + rowSpan <= rows) {
          visible.push(articles[i]);
          currentCol += colSpan;
        } else {
          break; // Para de adicionar cards quando não couber mais
        }
      }
      
      setVisibleArticles(visible);
    };

    calculateVisibleCards();
    window.addEventListener('resize', calculateVisibleCards);
    
    return () => window.removeEventListener('resize', calculateVisibleCards);
  }, [articles, sizes]);

  return (
    <main 
      style={{ 
        padding: '2rem 0',
        background: 'linear-gradient(145deg, #ffffff 0%, #f9f6fc 15%, #f3eef9 30%, #ece4f5 45%, #e4d9f0 60%, #dbcdeb 75%, #d1bfe6 88%, #c7b0e0 100%)',
      }}
    >
      {/* Efeito de fundo com orbes */}
      <div style={{
        position: 'absolute',
        top: '-35%',
        left: '-12%',
        width: '65%',
        height: '110%',
        background: 'radial-gradient(ellipse at center, rgba(153, 50, 204, 0.08) 0%, rgba(153, 50, 204, 0.04) 38%, transparent 68%)',
        pointerEvents: 'none',
        animation: 'float 17s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-28%',
        right: '-15%',
        width: '58%',
        height: '95%',
        background: 'radial-gradient(circle at center, rgba(153, 50, 204, 0.06) 0%, rgba(153, 50, 204, 0.03) 42%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float 19s ease-in-out infinite reverse',
      }} />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(28px, -22px) rotate(4deg); }
          66% { transform: translate(-18px, 18px) rotate(-4deg); }
        }

        @media (max-width: 767px) {
          .conhecimento-title {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            font-size: 1.75rem !important;
            text-align: left;
            padding: 1rem 1rem 0.5rem 1rem;
            margin-bottom: 0.5rem;
          }
          .conhecimento-grid-container {
            padding: 1rem !important;
            padding-top: 0 !important;
            overflow: visible !important;
            align-items: flex-start !important;
          }
          .conhecimento-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-auto-rows: minmax(160px, auto) !important;
            gap: 0.8rem !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .conhecimento-card {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
            min-height: 160px !important;
            padding: 1rem !important;
          }
          .conhecimento-card-icon {
            font-size: 2rem !important;
            margin-bottom: 0.4rem !important;
          }
          .conhecimento-card-title {
            font-size: 0.8rem !important;
            -webkit-line-clamp: 2 !important;
          }
          .conhecimento-card-snippet {
            display: none !important;
          }
          .conhecimento-card-badge {
            font-size: 0.6rem !important;
            padding: 0.2rem 0.5rem !important;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .conhecimento-title {
            font-size: 2.2rem !important;
            left: 2rem !important;
          }
          .conhecimento-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
          }
        }
      `}</style>

      {/* Title */}
      <div className="conhecimento-title" style={{
        position: 'relative',
        paddingTop: '1.5rem',
        paddingLeft: '100px',
        paddingRight: '2rem',
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: '2.8rem', color: 'darkorchid', fontWeight: 'bold', margin: 0 }}>
          Base de Conhecimento
        </h1>
      </div>

      {/* Grid Container */}
      <div 
        ref={gridRef}
        className="conhecimento-grid-container"
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 2%',
          overflow: 'hidden',
        }}
      >
        {/* CSS Animations */}
        <style>{`
          @keyframes floatSubtle {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(var(--float-distance));
            }
          }
        `}</style>

        {articles.length > 0 && visibleArticles.length > 0 ? (
          <div 
            className="conhecimento-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gridAutoRows: '220px',
              gap: '1.2rem',
              width: '100%',
              maxWidth: '1400px',
              maxHeight: '100%',
              overflow: 'hidden',
            }}>
            {visibleArticles.map((article, index) => {
              const articleIndex = articles.indexOf(article);
              const size = sizes[articleIndex];
              const animation = animations[articleIndex];
              const gridColumnSpan = size === 'large' ? 2 : size === 'medium' ? 2 : 1;
              const gridRowSpan = size === 'large' ? 2 : 1;

              return (
                <div
                  key={article.id}
                  className="conhecimento-card"
                  onMouseEnter={() => setHoveredArticle(article.id)}
                  onMouseLeave={() => setHoveredArticle(null)}
                  style={{
                    gridColumn: `span ${gridColumnSpan}`,
                    gridRow: `span ${gridRowSpan}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: size === 'large' ? '1.5rem' : '1rem',
                    borderRadius: '16px',
                    background: hoveredArticle === article.id 
                      ? 'rgba(153, 50, 204, 0.12)'
                      : 'rgba(255, 255, 255, 0.75)',
                    border: `2px solid ${hoveredArticle === article.id ? 'darkorchid' : 'rgba(153, 50, 204, 0.15)'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: hoveredArticle === article.id 
                      ? '0 15px 35px rgba(153, 50, 204, 0.2)' 
                      : '0 5px 15px rgba(0, 0, 0, 0.06)',
                    backdropFilter: 'blur(12px)',
                    overflow: 'hidden',
                    position: 'relative',
                    animation: hoveredArticle === article.id ? 'none' : `floatSubtle ${animation?.duration || 4}s ease-in-out infinite`,
                    animationDelay: `${animation?.delay || 0}s`,
                    // @ts-ignore
                    '--float-distance': `${animation?.translateY || 0}px`,
                  }}
                >
                  {/* Icon */}
                  <div className="conhecimento-card-icon" style={{
                    fontSize: size === 'large' ? '3.5rem' : size === 'medium' ? '2.8rem' : '2.2rem',
                    marginBottom: '0.5rem',
                    transition: 'transform 0.3s ease',
                    transform: hoveredArticle === article.id ? 'scale(1.2)' : 'scale(1)',
                  }}>
                    {article.icon}
                  </div>

                  {/* Category Badge */}
                  <div className="conhecimento-card-badge" style={{
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(153, 50, 204, 0.12)',
                    color: 'darkorchid',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '90%',
                  }}>
                    {article.category}
                  </div>

                  {/* Title */}
                  <h3 className="conhecimento-card-title" style={{
                    color: 'darkorchid',
                    fontSize: size === 'large' ? '1rem' : size === 'medium' ? '0.9rem' : '0.8rem',
                    fontWeight: 'bold',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: size === 'large' ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}>
                    {article.title}
                  </h3>

                  {/* Snippet - Only show on hover for small, always for medium/large */}
                  {(hoveredArticle === article.id || size !== 'small') && (
                    <p className="conhecimento-card-snippet" style={{
                      color: '#555',
                      fontSize: size === 'large' ? '0.8rem' : '0.7rem',
                      lineHeight: '1.4',
                      margin: '0 0 0.8rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: size === 'large' ? 5 : size === 'medium' ? 3 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      opacity: hoveredArticle === article.id ? 1 : 0.85,
                      transition: 'opacity 0.3s ease',
                    }}>
                      {article.snippet}
                    </p>
                  )}

                  {/* Saiba Mais */}
                  <a
                    href={article.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.75rem',
                      color: 'darkorchid',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: 'auto',
                      transition: 'all 0.3s ease',
                      transform: hoveredArticle === article.id ? 'translateX(4px)' : 'translateX(0)',
                      opacity: hoveredArticle === article.id ? 1 : 0.7,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Saiba Mais
                    <i className="la la-external-link-alt" style={{ fontSize: '0.85rem' }} />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '1.1rem' }}>
            Carregando artigos...
          </div>
        )}
      </div>
    </main>
  );
}
