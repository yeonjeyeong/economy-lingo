'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface RankingUser {
    rank: number;
    username: string;
    score: number;
    quizzesTaken: number;
    avatar: string;
}

export default function RankingPage() {
    const router = useRouter();
    const [period, setPeriod] = useState('daily');
    const [rankings, setRankings] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankings();
    }, [period]);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('score', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);

            const fetchedRankings: RankingUser[] = [];
            let rank = 1;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedRankings.push({
                    rank: rank++,
                    username: data.username || 'Anonymous',
                    score: data.score || 0,
                    quizzesTaken: data.quizzesTaken || 0,
                    avatar: data.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + doc.id
                });
            });

            setRankings(fetchedRankings);
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getGrade = (score: number) => {
        if (score >= 10000) return { name: 'Diamond', icon: '💎', color: '#b9f2ff' };
        if (score >= 3000) return { name: 'Gold', icon: '🥇', color: '#ffd700' };
        if (score >= 1000) return { name: 'Silver', icon: '🥈', color: '#c0c0c0' };
        return { name: 'Bronze', icon: '🥉', color: '#cd7f32' };
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <BackButton style={{ marginRight: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)' }}>랭킹</h1>
                </div>

                {/* Filter Tabs */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    {['daily', 'weekly', 'all'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: period === p ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                color: period === p ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: period === p ? 'bold' : 'normal'
                            }}
                        >
                            {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '전체'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
                        <p>랭킹을 불러오는 중...</p>
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>랭킹 데이터가 없습니다.</p>
                        <button
                            onClick={() => router.push('/quiz')}
                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)' }}
                        >
                            퀴즈 풀러 가기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {rankings.map((user) => {
                            const grade = getGrade(user.score);
                            return (
                                <div
                                    key={user.rank}
                                    className="card"
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        background: user.rank <= 3 ? 'linear-gradient(to right, #ffd89b, #19547b)' : 'var(--card-bg)',
                                        color: user.rank <= 3 ? 'white' : 'var(--text-primary)',
                                        boxShadow: user.rank <= 3 ? '0 4px 12px rgba(0,0,0,0.15)' : 'var(--card-shadow)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem', minWidth: '40px', fontWeight: 'bold' }}>
                                        {getMedalEmoji(user.rank)}
                                    </div>
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid white' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{user.username}</div>
                                        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                                            {grade.icon} {grade.name} • 퀴즈 {user.quizzesTaken}회
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                        {user.score}점
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius)',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'white'
                }}>
                    💡 퀴즈를 풀고 랭킹을 올려보세요!
                </div>
            </div>
        </div>
    );
}
