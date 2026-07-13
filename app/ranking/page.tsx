'use client';

import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';

type RankingPeriod = 'daily' | 'weekly' | 'all';

interface RankingUser {
    id: string;
    rank: number;
    displayName: string;
    score: number;
    quizzesTaken: number;
}

interface LocalStats {
    totalScore?: number;
    dailyScore?: number;
    weeklyScore?: number;
    quizzesTaken?: number;
    dayKey?: string;
    weekKey?: string;
}

function localDateKey(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localWeekKey(date = new Date()): string {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const weekday = day.getDay() || 7;
    day.setDate(day.getDate() + 4 - weekday);
    const yearStart = new Date(day.getFullYear(), 0, 1);
    const week = Math.ceil((((day.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${day.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function readDeviceRanking(period: RankingPeriod): RankingUser[] {
    try {
        const stats = JSON.parse(localStorage.getItem('economyLingoStats') ?? '{}') as LocalStats;
        const metric: 'dailyScore' | 'weeklyScore' | 'totalScore' = period === 'daily' ? 'dailyScore' : period === 'weekly' ? 'weeklyScore' : 'totalScore';
        if (period === 'daily' && stats.dayKey !== localDateKey()) return [];
        if (period === 'weekly' && stats.weekKey !== localWeekKey()) return [];
        const score = Math.max(0, Number(stats[metric]) || 0);
        if (score === 0) return [];
        return [{
            id: 'this-device',
            rank: 1,
            displayName: '이 기기의 학습 기록',
            score,
            quizzesTaken: Math.max(0, Number(stats.quizzesTaken) || 0)
        }];
    } catch {
        return [];
    }
}

export default function RankingPage() {
    const [period, setPeriod] = useState<RankingPeriod>('daily');
    const [rankings, setRankings] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeviceOnly, setIsDeviceOnly] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchRankings = async () => {
            setLoading(true);
            setError('');
            setIsDeviceOnly(false);
            try {
                const response = await fetch(`/api/ranking?period=${period}`, { cache: 'no-store' });
                const data = await response.json() as { rankings?: RankingUser[]; unavailable?: boolean; error?: string };
                if (!response.ok || !Array.isArray(data.rankings)) throw new Error(data.error || '랭킹을 불러오지 못했습니다.');

                if (cancelled) return;
                if (data.rankings.length > 0) {
                    setRankings(data.rankings);
                } else {
                    setRankings(readDeviceRanking(period));
                    setIsDeviceOnly(true);
                }
            } catch (rankingError) {
                console.error('Failed to fetch public rankings:', rankingError);
                if (cancelled) return;
                setRankings(readDeviceRanking(period));
                setIsDeviceOnly(true);
                setError('공개 랭킹에 연결하지 못해 이 기기에 저장된 기록만 표시합니다.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchRankings();
        return () => { cancelled = true; };
    }, [period]);

    const periodLabels: Record<RankingPeriod, string> = { daily: '오늘', weekly: '이번 주', all: '전체' };

    return (
        <main style={{ minHeight: '100vh', padding: '2rem 1rem', background: 'var(--bg-gradient)' }}>
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <BackButton />
                    <h1 style={{ margin: 0, color: 'white' }}>🏅 학습 랭킹</h1>
                </header>
                <nav aria-label="랭킹 기간" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(Object.keys(periodLabels) as RankingPeriod[]).map((item) => (
                        <button
                            key={item}
                            onClick={() => setPeriod(item)}
                            style={{
                                padding: '0.7rem 1.1rem', borderRadius: '999px', cursor: 'pointer', fontWeight: 700,
                                border: '1px solid var(--border-color)',
                                background: item === period ? 'var(--primary)' : 'var(--card-bg)',
                                color: item === period ? 'white' : 'var(--text-primary)'
                            }}
                        >
                            {periodLabels[item]}
                        </button>
                    ))}
                </nav>

                {(error || isDeviceOnly) && (
                    <div style={{ padding: '0.85rem 1rem', marginBottom: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,.18)', color: 'white' }}>
                        {error || '아직 공개된 점수 데이터가 없어 이 기기의 기록만 표시합니다.'}
                    </div>
                )}

                {loading ? (
                    <section style={emptyStyle}>랭킹을 불러오는 중...</section>
                ) : rankings.length === 0 ? (
                    <section style={emptyStyle}>
                        <div style={{ fontSize: '3rem' }}>📭</div>
                        <h2>표시할 학습 기록이 없어요</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>퀴즈를 완료하면 이 기기에 기록이 안전하게 저장됩니다.</p>
                    </section>
                ) : (
                    <section style={{ display: 'grid', gap: '0.75rem' }}>
                        {rankings.map((user) => (
                            <article key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                                <strong style={{ width: '2.5rem', fontSize: '1.25rem' }}>{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}</strong>
                                <div aria-hidden="true" style={{ width: '46px', height: '46px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'rgba(79,172,254,.16)', fontSize: '1.2rem', fontWeight: 800 }}>
                                    {Array.from(user.displayName)[0] || '👤'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{user.displayName}</strong>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>완료한 퀴즈 {user.quizzesTaken}회</div>
                                </div>
                                <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{user.score.toLocaleString()}점</strong>
                            </article>
                        ))}
                    </section>
                )}
                <p style={{ textAlign: 'center', color: 'white', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                    이메일 등 비공개 계정 정보는 랭킹에 조회하거나 표시하지 않습니다.
                </p>
            </div>
        </main>
    );
}

const emptyStyle: React.CSSProperties = {
    padding: '3rem 1rem', textAlign: 'center', borderRadius: '1rem', background: 'var(--card-bg)', color: 'var(--text-primary)', boxShadow: 'var(--card-shadow)'
};
