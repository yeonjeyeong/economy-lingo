import Link from 'next/link';

const features = [
  { icon: '✦', title: '경제 퀴즈', description: '난이도와 문제 수를 고르고 해설까지 확인해요.', href: '/quiz', tone: 'mint' },
  { icon: '↗', title: '기간별 랭킹', description: '일간·주간·전체 기록을 구분해 내 성장을 확인해요.', href: '/ranking', tone: 'violet' },
  { icon: '▤', title: '경제 뉴스', description: '최근 경제 이슈를 읽고 핵심 용어를 연결해요.', href: '/news', tone: 'blue' },
  { icon: '□', title: '경제 캘린더', description: '주요 지표를 익히고 나만의 학습 일정을 더해요.', href: '/calendar', tone: 'amber' },
  { icon: '◎', title: '커뮤니티', description: '질문과 의견을 나누고 한 번만 반응할 수 있어요.', href: '/community', tone: 'coral' },
  { icon: '↺', title: '오답 노트', description: '내가 고른 답과 해설을 보고 오답만 다시 풀어요.', href: '/wrong-answers', tone: 'red' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <p className="home-kicker">ECONOMY, IN YOUR LANGUAGE</p>
          <h1 id="home-title">경제가 어려울수록,<br /><span>쉬운 말부터.</span></h1>
          <p className="home-hero__description">
            한 문제를 풀고, 한 기사를 읽고, 한 번 더 복습하세요.<br />
            로그인 없이 둘러보고 Google 로그인으로 기록을 동기화할 수 있습니다.
          </p>
          <div className="home-hero__actions">
            <Link href="/quiz" className="home-cta home-cta--primary">오늘의 퀴즈 시작</Link>
            <Link href="/news" className="home-cta home-cta--secondary">경제 뉴스 읽기</Link>
          </div>
        </div>
        <aside className="home-routine" aria-label="10분 학습 루틴">
          <p className="home-routine__label">오늘의 10분 루틴</p>
          <ol>
            <li><span>01</span><div><strong>3분</strong><p>경제 용어 퀴즈</p></div></li>
            <li><span>02</span><div><strong>4분</strong><p>뉴스 한 편 읽기</p></div></li>
            <li><span>03</span><div><strong>3분</strong><p>오답 다시 보기</p></div></li>
          </ol>
          <p className="home-routine__note">작은 반복이 경제 감각을 만듭니다.</p>
        </aside>
      </section>

      <section className="home-features" aria-labelledby="feature-title">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">LEARN YOUR WAY</p>
            <h2 id="feature-title">필요한 기능을 바로 시작하세요</h2>
          </div>
          <p>학습 콘텐츠는 게스트로 볼 수 있고, 글쓰기와 기록 동기화에는 로그인이 필요합니다.</p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className={`feature-card feature-card--${feature.tone}`}>
              <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
              <span className="feature-card__body">
                <strong>{feature.title}</strong>
                <span>{feature.description}</span>
              </span>
              <span className="feature-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="trust-strip" aria-label="서비스 원칙">
        <div><strong>게스트 우선</strong><span>뉴스·캘린더·퀴즈 공개</span></div>
        <div><strong>정직한 대체 콘텐츠</strong><span>실시간 연결 실패를 명확히 표시</span></div>
        <div><strong>개인정보 최소화</strong><span>공개 랭킹에 이메일 미사용</span></div>
      </section>

      <footer className="home-footer">
        <strong>경제 링고</strong>
        <span>오늘의 언어로 배우는 경제</span>
      </footer>
    </div>
  );
}
