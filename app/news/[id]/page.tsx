'use client';

import BackButton from '@/components/BackButton';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function getSafeUrl(value: string | null) {
    if (!value) return null;
    if (value.startsWith('/') && !value.startsWith('//')) return value;
    try {
        const parsed = new URL(value);
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
    } catch {
        return null;
    }
}

function NewsDetailContent() {
    const searchParams = useSearchParams();
    const url = getSafeUrl(searchParams.get('url'));
    const title = searchParams.get('title') || '경제 뉴스';
    const external = Boolean(url && /^https?:\/\//i.test(url));

    return (
        <main className="detail-page">
            <div className="detail-shell">
                <BackButton />
                <section className="detail-card">
                    <span aria-hidden="true" className="icon">📰</span>
                    <h1>{title}</h1>
                    {url ? (
                        <>
                            <p>언론사 보안 정책에 따라 사이트 안에서 기사를 바로 표시하지 않습니다. 아래 버튼을 눌러 안전하게 원문을 확인해 주세요.</p>
                            <a href={url} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                                {external ? '기사 원문 새 창에서 보기' : '학습 콘텐츠 보기'}
                            </a>
                        </>
                    ) : (
                        <p role="alert">올바른 기사 주소가 없습니다. 뉴스 목록으로 돌아가 다른 기사를 선택해 주세요.</p>
                    )}
                </section>
            </div>
            <style jsx>{`
                .detail-page { min-height: 100vh; padding: 2rem 1rem; background: var(--bg-gradient); }
                .detail-shell { max-width: 760px; margin: 0 auto; }
                .detail-card { margin-top: 1.5rem; padding: clamp(1.5rem, 5vw, 3rem); border: 1px solid var(--border-color); border-radius: 1.25rem; background: var(--card-bg); box-shadow: var(--card-shadow); text-align: center; }
                .icon { display: block; margin-bottom: .75rem; font-size: 2.5rem; }
                h1 { margin: 0 0 1rem; color: var(--text-primary); font-size: clamp(1.4rem, 5vw, 2rem); line-height: 1.4; }
                p { margin: 0 auto 1.5rem; max-width: 580px; color: var(--text-secondary); line-height: 1.7; }
                a { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: .7rem 1.2rem; border-radius: .65rem; background: var(--primary); color: white; font-weight: 700; text-decoration: none; }
                a:focus-visible { outline: 3px solid #ffd54f; outline-offset: 3px; }
            `}</style>
        </main>
    );
}

export default function NewsDetailPage() {
    return (
        <Suspense fallback={<main style={{ minHeight: '100vh', padding: '3rem', background: 'var(--bg-gradient)', color: 'white', textAlign: 'center' }}>뉴스를 준비하는 중입니다…</main>}>
            <NewsDetailContent />
        </Suspense>
    );
}
