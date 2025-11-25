'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    company: string;
    date: string;
    tags: string[];
}

export default function NewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);

    const stocks = [
        { code: null, name: '전체' },
        { code: '005930', name: '삼성전자' },
        { code: '005380', name: '현대차' },
        { code: '000660', name: 'SK하이닉스' },
        { code: '035420', name: 'NAVER' }
    ];

    useEffect(() => {
        fetchNews();
    }, [selectedStock]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const url = selectedStock
                ? `/api/news?stock=${selectedStock}`
                : '/api/news';
            const res = await fetch(url);
            const data = await res.json();
            setNews(data.news || []);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', padding: '2rem 1rem', transition: 'background 0.3s ease' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <BackButton style={{ marginRight: '1rem' }} />
                    <h1 style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)' }}>📰 경제 뉴스</h1>
                </div>

                {/* Filter */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {stocks.map((stock) => (
                        <button
                            key={stock.code || 'all'}
                            onClick={() => setSelectedStock(stock.code)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: selectedStock === stock.code ? 'white' : 'rgba(255,255,255,0.2)',
                                color: selectedStock === stock.code ? 'var(--primary)' : 'white',
                                border: 'none',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                fontWeight: selectedStock === stock.code ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                        >
                            {stock.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
                        <p>뉴스를 불러오는 중...</p>
                    </div>
                ) : news.length === 0 ? (
                    <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>뉴스가 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {news.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'var(--card-bg)',
                                    padding: '1.5rem',
                                    borderRadius: '1rem',
                                    boxShadow: 'var(--card-shadow)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    border: '1px solid var(--border-color)'
                                }}
                                onClick={() => window.open(item.url, '_blank')}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    {item.summary}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <span>{item.company}</span>
                                    <span>{item.date}</span>
                                </div>
                                {item.tags && item.tags.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {item.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'var(--border-color)',
                                                    color: 'var(--text-primary)',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'white'
                }}>
                    💡 최신 경제 뉴스를 확인하세요!
                </div>
            </div>
        </div>
    );
}
