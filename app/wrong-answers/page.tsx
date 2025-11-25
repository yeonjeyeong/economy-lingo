'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: string;
    explanation: string;
}

export default function WrongAnswersPage() {
    const router = useRouter();
    const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('wrongAnswers');
        if (saved) {
            try {
                setWrongAnswers(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse wrong answers', e);
            }
        }
        setLoading(false);
    }, []);

    const clearWrongAnswers = () => {
        if (confirm('오답 노트를 초기화하시겠습니까?')) {
            localStorage.removeItem('wrongAnswers');
            setWrongAnswers([]);
        }
    };

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BackButton style={{ marginRight: '1rem' }} />
                        <h1 style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)' }}>📝 오답 노트</h1>
                    </div>
                    {wrongAnswers.length > 0 && (
                        <button
                            onClick={clearWrongAnswers}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--warning)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            🗑️ 초기화
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
                        <p>오답 노트를 불러오는 중...</p>
                    </div>
                ) : wrongAnswers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>오답 노트가 비어있어요!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>틀린 문제가 없거나 아직 퀴즈를 풀지 않았네요.</p>
                        <button
                            onClick={() => router.push('/quiz')}
                            style={{
                                marginTop: '1.5rem',
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            퀴즈 풀러 가기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {wrongAnswers.map((question, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'var(--card-bg)',
                                    padding: '1.5rem',
                                    borderRadius: '1rem',
                                    boxShadow: 'var(--card-shadow)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1rem',
                                    background: question.difficulty === 'easy' ? 'rgba(46, 125, 50, 0.1)' : question.difficulty === 'medium' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                                    color: question.difficulty === 'easy' ? '#2e7d32' : question.difficulty === 'medium' ? '#f57c00' : '#c62828'
                                }}>
                                    {question.difficulty === 'easy' ? '쉬움' : question.difficulty === 'medium' ? '보통' : '어려움'}
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                    Q. {question.question}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {question.options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                background: idx === question.correctAnswer ? 'rgba(46, 125, 50, 0.1)' : 'var(--background)',
                                                color: idx === question.correctAnswer ? '#2e7d32' : 'var(--text-secondary)',
                                                border: idx === question.correctAnswer ? '1px solid #4caf50' : '1px solid var(--border-color)',
                                                fontWeight: idx === question.correctAnswer ? 'bold' : 'normal'
                                            }}
                                        >
                                            {idx + 1}. {option} {idx === question.correctAnswer && '✅'}
                                        </div>
                                    ))}
                                </div>
                                <div style={{
                                    background: 'rgba(255, 152, 0, 0.1)',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    borderLeft: '4px solid #ff9800'
                                }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#e65100' }}>💡 해설</p>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{question.explanation}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
