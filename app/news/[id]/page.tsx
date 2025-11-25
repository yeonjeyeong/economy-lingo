'use client';

import BackButton from '@/components/BackButton';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NewsDetailContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');
    const title = searchParams.get('title');

    if (!url) {
        return (
            <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
                    <BackButton />
                    <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>뉴스 URL이 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <BackButton style={{ marginRight: '1rem', flexShrink: 0 }} />
                        {title && (
                            <h1 style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {decodeURIComponent(title)}
                            </h1>
                        )}
                    </div>
                    <button
                        onClick={() => window.open(url, '_blank')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginLeft: '1rem',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        🔗 새 탭에서 열기
                    </button>
                </div>

                {/* News Content in iframe */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--border-color)',
                    height: 'calc(100vh - 10rem)',
                    position: 'relative'
                }}>
                    {/* Fallback message for blocked iframe */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📰</p>
                        <p>iframe이 차단된 경우 위의 "새 탭에서 열기" 버튼을 클릭하세요</p>
                    </div>
                    <iframe
                        src={url}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            position: 'relative',
                            zIndex: 2,
                            background: 'var(--card-bg)'
                        }}
                        title={title || '뉴스 기사'}
                    />
                </div>
            </div>
        </div>
    );
}

export default function NewsDetailPage() {
    return (
        <Suspense fallback={
            <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white' }}>로딩 중...</p>
            </div>
        }>
            <NewsDetailContent />
        </Suspense>
    );
}
