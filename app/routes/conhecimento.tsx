import type { LinksFunction, MetaFunction } from '@remix-run/node';
import { useEffect, useRef, useState } from 'react';
import knowledgeBase from '~/data/knowledge-base.json';
import siteStyle from '~/assets/css/site.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: siteStyle }];

export const meta: MetaFunction = () => {
  return [
    { title: 'Base de Conhecimento - Associacao Bendita Canabica' },
    { name: 'description', content: 'Pesquisa cientifica sobre cannabis medicinal com referencias reais' },
  ];
};

function shuffleArticles(allArticles: any[]) {
  return [...allArticles].sort(() => 0.5 - Math.random());
}

function generateRandomSizes(count: number) {
  const sizes = ['small', 'medium', 'large'];
  return Array.from({ length: count }, () => {
    const random = Math.random();
    if (random < 0.5) return 'small';
    if (random < 0.85) return 'medium';
    return 'large';
  });
}

function generateRandomAnimations(count: number) {
  return Array.from({ length: count }, () => ({
    translateY: Math.random() * 10 - 5,
    duration: 3 + Math.random() * 3,
    delay: Math.random() * 2,
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

  useEffect(() => {
    const randomArticles = shuffleArticles(knowledgeBase.articles);
    setArticles(randomArticles);
    setSizes(generateRandomSizes(randomArticles.length));
    setAnimations(generateRandomAnimations(randomArticles.length));
    setScrollPositions(new Array(randomArticles.length).fill(0));
  }, []);

  useEffect(() => {
    if (visibleArticles.length === 0) return;

    let startTime = Date.now();
    const speeds = visibleArticles.map(() => 0.02 + Math.random() * 0.03);

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - startTime;
      startTime = currentTime;

      setScrollPositions((prev) =>
        prev.map((pos, index) => {
          if (hoveredArticle === visibleArticles[index]?.id) return pos;

          const speed = speeds[index] || 0.03;
          let newPos = pos + speed * deltaTime;

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

  useEffect(() => {
    if (articles.length === 0 || sizes.length === 0) return;

    const calculateVisibleCards = () => {
      if (!gridRef.current) {
        setTimeout(calculateVisibleCards, 100);
        return;
      }

      const gridElement = gridRef.current;
      const containerHeight = gridElement.clientHeight;
      const containerWidth = gridElement.clientWidth;

      const cellSize = 220;
      const gap = 19.2;

      const columns = Math.floor((containerWidth + gap) / (cellSize + gap));
      const rows = Math.floor((containerHeight + gap) / (cellSize + gap));

      const visible: any[] = [];
      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < articles.length; i++) {
        const size = sizes[i];
        const colSpan = size === 'large' || size === 'medium' ? 2 : 1;
        const rowSpan = size === 'large' ? 2 : 1;

        if (currentCol + colSpan > columns) {
          currentCol = 0;
          currentRow++;
        }

        if (currentRow + rowSpan <= rows) {
          visible.push(articles[i]);
          currentCol += colSpan;
        } else {
          break;
        }
      }

      setVisibleArticles(visible);
    };

    calculateVisibleCards();
    window.addEventListener('resize', calculateVisibleCards);

    return () => window.removeEventListener('resize', calculateVisibleCards);
  }, [articles, sizes]);

  return (
    <main className='public-shell public-knowledge'>
      <section className='public-hero'>
        <div className='public-container'>
          <div>
            <div className='public-kicker'>Conhecimento</div>
            <h1 className='public-title'>
              Base cientifica para <strong>decisoes seguras</strong>.
            </h1>
            <p className='public-lead'>
              Artigos e estudos organizados para apoiar profissionais e associados com informacao confiavel.
            </p>
          </div>
        </div>
      </section>

      <section className='public-section public-section--alt'>
        <div className='public-container public-knowledge-container' ref={gridRef}>
          <style>{`
            @keyframes floatSubtle {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(var(--float-distance)); }
            }
          `}</style>

          {articles.length > 0 && visibleArticles.length > 0 ? (
            <div className='public-knowledge-grid'>
              {visibleArticles.map((article, index) => {
                const articleIndex = articles.indexOf(article);
                const size = sizes[articleIndex];
                const animation = animations[articleIndex];
                const gridColumnSpan = size === 'large' ? 2 : size === 'medium' ? 2 : 1;
                const gridRowSpan = size === 'large' ? 2 : 1;

                return (
                  <div
                    key={article.id}
                    className='public-knowledge-card'
                    onMouseEnter={() => setHoveredArticle(article.id)}
                    onMouseLeave={() => setHoveredArticle(null)}
                    style={{
                      gridColumn: `span ${gridColumnSpan}`,
                      gridRow: `span ${gridRowSpan}`,
                      animation:
                        hoveredArticle === article.id
                          ? 'none'
                          : `floatSubtle ${animation?.duration || 4}s ease-in-out infinite`,
                      animationDelay: `${animation?.delay || 0}s`,
                      // @ts-ignore
                      '--float-distance': `${animation?.translateY || 0}px`,
                    }}
                  >
                    <div style={{ fontSize: size === 'large' ? '2.6rem' : size === 'medium' ? '2.1rem' : '1.8rem' }}>
                      {article.icon}
                    </div>
                    <div className='public-knowledge-category'>{article.category}</div>
                    <div className='public-knowledge-title'>{article.title}</div>
                    {(hoveredArticle === article.id || size !== 'small') && (
                      <div className='public-knowledge-snippet'>{article.snippet}</div>
                    )}
                    <a
                      className='public-knowledge-link'
                      href={article.url || '#'}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={(e) => e.stopPropagation()}
                    >
                      Saiba mais
                      <i className='la la-external-link-alt' style={{ fontSize: '0.85rem' }} />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', fontSize: '1.1rem' }}>Carregando artigos...</div>
          )}
        </div>
      </section>
    </main>
  );
}
