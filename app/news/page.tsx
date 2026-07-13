'use client';

import BackButton from '@/components/BackButton';
import { useCallback, useEffect, useState } from 'react';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    company: string;
    date: string;
    tags: string[];
    isFallback?: boolean;
}

const STOCKS = [
    { code: null, name: '전체' },
    { code: '005930', name: '삼성전자' },
    { code: '005380', name: '현대자동차' },
    { code: '000660', name: 'SK하이닉스' },
    { code: '035420', name: 'NAVER' }
] as const;

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [retryKey, setRetryKey] = useState(0);

    const fetchNews = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError('');
        setNotice('');

        try {
            const url = selectedStock ? `/api/news?stock=${selectedStock}` : '/api/news';
            const response = await fetch(url, { signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '뉴스를 불러오지 못했습니다.');

            setNews(Array.isArray(data.news) ? data.news : []);
            if (data.fallback) {
                setNotice(data.message || '실시간 뉴스 대신 학습 콘텐츠를 표시합니다.');
            }
        } catch (fetchError) {
            if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
            console.error('Failed to fetch news:', fetchError);
            setNews([]);
            setError('뉴스를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [selectedStock]);

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => void fetchNews(controller.signal), 0);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [fetchNews, retryKey]);

    return (
        <main className="news-page">
            <div className="news-shell">
                <header className="news-header">
                    <BackButton style={{ marginRight: '1rem' }} />
                    <div>
                        <h1>경제 뉴스</h1>
                        <p>주요 경제 흐름을 최신 기사로 확인해 보세요.</p>
                    </div>
                </header>

                <div className="stock-filter" role="group" aria-label="뉴스 종목 필터">
                    {STOCKS.map((stock) => (
                        <button
                            key={stock.code || 'all'}
                            type="button"
                            aria-pressed={selectedStock === stock.code}
                            onClick={() => setSelectedStock(stock.code)}
                        >
                            {stock.name}
                        </button>
                    ))}
                </div>

                {notice && (
                    <div className="notice" role="status">
                        <span>{notice}</span>
                        <button type="button" onClick={() => setRetryKey((key) => key + 1)}>뉴스 다시 시도</button>
                    </div>
                )}

                {loading ? (
                    <div className="state" role="status" aria-live="polite">뉴스를 불러오는 중입니다…</div>
                ) : error ? (
                    <div className="state card" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={() => setRetryKey((key) => key + 1)}>다시 시도</button>
                    </div>
                ) : news.length === 0 ? (
                    <div className="state card">
                        <p>표시할 뉴스가 없습니다.</p>
                        <button type="button" onClick={() => setRetryKey((key) => key + 1)}>새로고침</button>
                    </div>
                ) : (
                    <section className="news-list" aria-label="뉴스 목록">
                        {news.map((item) => {
                            const external = /^https?:\/\//i.test(item.url);
                            return (
                                <article className="news-card" key={item.id}>
                                    <a
                                        href={item.url}
                                        target={external ? '_blank' : undefined}
                                        rel={external ? 'noopener noreferrer' : undefined}
                                        aria-label={`${item.title}${external ? ' (새 창에서 열림)' : ''}`}
                                    >
                                        <h2>{item.title}</h2>
                                        {item.summary && <p>{item.summary}</p>}
                                        <div className="news-meta">
                                            <span>{item.company}</span>
                                            {item.date && <time dateTime={item.date}>{item.date}</time>}
                                        </div>
                                        {item.tags?.length > 0 && (
                                            <div className="tags" aria-label="뉴스 태그">
                                                {item.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                                            </div>
                                        )}
                                        <span className="read-more">{item.isFallback ? '학습하러 가기' : '기사 원문 보기 ↗'}</span>
                                    </a>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>

            <style jsx>{`
                .news-page { min-height: 100vh; padding: 2rem 1rem; background: var(--bg-gradient); }
                .news-shell { max-width: 900px; margin: 0 auto; }
                .news-header { display: flex; align-items: center; margin-bottom: 1.5rem; color: white; }
                .news-header h1 { margin: 0 0 .3rem; font-size: clamp(1.7rem, 5vw, 2.2rem); text-shadow: var(--header-text-shadow); }
                .news-header p { margin: 0; color: rgba(255,255,255,.88); font-size: .95rem; }
                .stock-filter { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
                .stock-filter button, .notice button, .state button { min-height: 42px; padding: .55rem 1rem; border: 1px solid rgba(255,255,255,.45); border-radius: 999px; background: rgba(255,255,255,.18); color: white; cursor: pointer; font-weight: 600; }
                .stock-filter button[aria-pressed='true'] { background: white; color: var(--primary); }
                button:focus-visible, a:focus-visible { outline: 3px solid #ffd54f; outline-offset: 3px; }
                .notice { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: .85rem 1rem; border-radius: .75rem; background: rgba(255,255,255,.92); color: var(--text-primary); }
                .notice button, .state button { border-color: var(--primary); background: var(--primary); }
                .state { padding: 3rem 1rem; color: white; text-align: center; }
                .state.card { border: 1px solid var(--border-color); border-radius: 1rem; background: var(--card-bg); color: var(--text-secondary); box-shadow: var(--card-shadow); }
                .state p { margin: 0 0 1rem; }
                .news-list { display: grid; gap: 1rem; }
                .news-card { overflow: hidden; border: 1px solid var(--border-color); border-radius: 1rem; background: var(--card-bg); box-shadow: var(--card-shadow); transition: transform .2s, box-shadow .2s; }
                .news-card:hover { transform: translateY(-2px); }
                .news-card a { display: block; padding: 1.4rem; color: inherit; text-decoration: none; }
                .news-card h2 { margin: 0 0 .55rem; color: var(--text-primary); font-size: 1.1rem; line-height: 1.45; }
                .news-card p { margin: 0 0 1rem; color: var(--text-secondary); font-size: .9rem; line-height: 1.55; }
                .news-meta { display: flex; justify-content: space-between; gap: 1rem; color: var(--text-secondary); font-size: .78rem; }
                .tags { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .75rem; }
                .tags span { padding: .2rem .5rem; border-radius: 999px; background: var(--border-color); color: var(--text-primary); font-size: .72rem; }
                .read-more { display: inline-block; margin-top: .9rem; color: var(--primary); font-size: .85rem; font-weight: 700; }
                @media (max-width: 560px) {
                    .news-page { padding: 1.2rem .75rem; }
                    .news-header { align-items: flex-start; }
                    .news-header p { display: none; }
                    .stock-filter { flex-wrap: nowrap; padding-bottom: .35rem; overflow-x: auto; }
                    .stock-filter button { flex: 0 0 auto; }
                    .notice { align-items: flex-start; flex-direction: column; }
                    .news-card a { padding: 1.1rem; }
                }
            `}</style>
        </main>
    );
}
