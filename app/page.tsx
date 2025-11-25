'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  const features = [
    {
      title: '📚 퀴즈',
      description: '경제 용어를 배우고 테스트하세요',
      href: '/quiz',
      color: 'var(--primary)'
    },
    {
      title: '🏆 랭킹',
      description: '다른 사용자들과 순위를 겨뤄보세요',
      href: '/ranking',
      color: 'var(--accent)'
    },
    {
      title: '📰 경제 뉴스',
      description: '최신 경제 뉴스를 확인하세요',
      href: '/news',
      color: 'var(--success)'
    },
    {
      title: '📅 경제 캘린더',
      description: '주요 경제 지표 일정을 확인하세요',
      href: '/calendar',
      color: 'var(--info)'
    },
    {
      title: '💬 커뮤니티',
      description: '경제에 대해 자유롭게 소통하세요',
      href: '/community',
      color: 'var(--warning)'
    },
    {
      title: '📝 오답 노트',
      description: '틀린 문제를 다시 복습하세요',
      href: '/wrong-answers',
      color: '#ff6b6b'
    }
  ];

  return (
    <div style={{
      background: 'var(--bg-gradient)',
      minHeight: '100vh',
      padding: '3rem 1.5rem',
      transition: 'background 0.3s ease'
    }}>
      <ThemeToggle />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: '3.5rem',
            color: 'white',
            marginBottom: '1rem',
            fontWeight: 'bold',
            textShadow: 'var(--header-text-shadow)'
          }}>
            💰 경제 링고
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)' }}>
            경제를 쉽고 재미있게 배우는 최고의 플랫폼
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, index) => (
            <Link
              key={feature.href}
              href={feature.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  padding: '2.5rem 2rem',
                  borderRadius: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`,
                  border: '1px solid var(--border-color)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                }}
              >
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1.5rem',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                }}>
                  {feature.title.split(' ')[0]}
                </div>
                <h2 style={{
                  fontSize: '1.75rem',
                  marginBottom: '1rem',
                  color: feature.color,
                  fontWeight: 'bold'
                }}>
                  {feature.title.substring(2)}
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <footer style={{
          textAlign: 'center',
          marginTop: '5rem',
          padding: '2rem',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '0.95rem'
        }}>
          <p>💡 지금 시작하고 경제 전문가가 되어보세요!</p>
        </footer>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
