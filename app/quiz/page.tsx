'use client';

import BackButton from '@/components/BackButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: Difficulty;
    explanation: string;
}

interface AnswerRecord {
    question: QuizQuestion;
    selectedAnswer: number;
    correct: boolean;
}

interface LocalStats {
    totalScore: number;
    dailyScore: number;
    weeklyScore: number;
    quizzesTaken: number;
    dayKey: string;
    weekKey: string;
}

const difficultyLabels: Record<Difficulty, string> = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움'
};

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

function readLocalStats(): LocalStats {
    const dayKey = localDateKey();
    const weekKey = localWeekKey();
    try {
        const stored = JSON.parse(localStorage.getItem('economyLingoStats') ?? '{}') as Partial<LocalStats>;
        return {
            totalScore: Number(stored.totalScore) || 0,
            dailyScore: stored.dayKey === dayKey ? Number(stored.dailyScore) || 0 : 0,
            weeklyScore: stored.weekKey === weekKey ? Number(stored.weeklyScore) || 0 : 0,
            quizzesTaken: Number(stored.quizzesTaken) || 0,
            dayKey,
            weekKey
        };
    } catch {
        return { totalScore: 0, dailyScore: 0, weeklyScore: 0, quizzesTaken: 0, dayKey, weekKey };
    }
}

export default function QuizPage() {
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [records, setRecords] = useState<AnswerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizComplete, setQuizComplete] = useState(false);
    const [isRetry, setIsRetry] = useState(false);
    const [source, setSource] = useState('');
    const answerLocked = useRef(false);
    const scoreSaved = useRef(false);

    const resetProgress = useCallback(() => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setRecords([]);
        setQuizComplete(false);
        answerLocked.current = false;
        scoreSaved.current = false;
    }, []);

    const loadQuiz = useCallback(async (nextDifficulty: Difficulty) => {
        setLoading(true);
        setError('');
        setDifficulty(nextDifficulty);
        setIsRetry(false);
        resetProgress();

        try {
            const response = await fetch(`/api/quiz-ai?count=5&difficulty=${nextDifficulty}`, { cache: 'no-store' });
            const data = await response.json() as { questions?: QuizQuestion[]; source?: string; error?: string };
            if (!response.ok) throw new Error(data.error || '퀴즈를 불러오지 못했습니다.');
            if (!Array.isArray(data.questions) || data.questions.length === 0) throw new Error('사용 가능한 문제가 없습니다.');
            setQuestions(data.questions);
            setSource(data.source ?? 'curated');
        } catch (loadError) {
            console.error('Failed to fetch quiz:', loadError);
            setQuestions([]);
            setError(loadError instanceof Error ? loadError.message : '퀴즈를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [resetProgress]);

    useEffect(() => {
        const initialize = async () => {
            await Promise.resolve();
            const retryWrong = new URLSearchParams(window.location.search).get('retry') === 'wrong';
            if (!retryWrong) {
                await loadQuiz('medium');
                return;
            }

            resetProgress();
            setIsRetry(true);
            setSource('wrong-note');
            try {
                const saved = JSON.parse(localStorage.getItem('wrongAnswers') ?? '[]') as QuizQuestion[];
                const validQuestions = Array.isArray(saved)
                    ? saved.filter((question) => question
                        && typeof question.question === 'string'
                        && Array.isArray(question.options)
                        && question.options.length === 4
                        && Number.isInteger(question.correctAnswer))
                    : [];
                if (validQuestions.length === 0) throw new Error('오답 노트에 다시 풀 문제가 없습니다.');
                setQuestions(validQuestions);
                setDifficulty(validQuestions[0].difficulty);
                setLoading(false);
            } catch (retryError) {
                setQuestions([]);
                setError(retryError instanceof Error ? retryError.message : '오답 문제를 불러오지 못했습니다.');
                setLoading(false);
            }
        };
        void initialize();
    }, [loadQuiz, resetProgress]);

    const saveWrongAnswer = (record: AnswerRecord) => {
        try {
            const existing = JSON.parse(localStorage.getItem('wrongAnswers') ?? '[]') as Array<QuizQuestion & { selectedAnswer?: number }>;
            const savedQuestion = { ...record.question, selectedAnswer: record.selectedAnswer };
            const duplicateIndex = existing.findIndex((item) => item.question === record.question.question);
            if (duplicateIndex >= 0) existing[duplicateIndex] = savedQuestion;
            else existing.push(savedQuestion);
            localStorage.setItem('wrongAnswers', JSON.stringify(existing));
        } catch (storageError) {
            console.error('Failed to save wrong answer:', storageError);
        }
    };

    const saveScore = async (finalScore: number) => {
        if (scoreSaved.current) return;
        scoreSaved.current = true;

        const safeScore = Math.max(0, Math.min(finalScore, questions.length * 100));
        const localStats = readLocalStats();
        const nextStats: LocalStats = {
            totalScore: localStats.totalScore + safeScore,
            dailyScore: localStats.dailyScore + safeScore,
            weeklyScore: localStats.weeklyScore + safeScore,
            quizzesTaken: localStats.quizzesTaken + 1,
            dayKey: localStats.dayKey,
            weekKey: localStats.weekKey
        };
        localStorage.setItem('economyLingoStats', JSON.stringify(nextStats));

        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const profileRef = doc(db, 'publicProfiles', user.uid);
        try {
            await runTransaction(db, async (transaction) => {
                const [userSnapshot, profileSnapshot] = await Promise.all([
                    transaction.get(userRef),
                    transaction.get(profileRef)
                ]);
                const current = profileSnapshot.data() ?? userSnapshot.data() ?? {};
                const totalScore = (Number(current.totalScore ?? current.score) || 0) + safeScore;
                const dailyScore = current.dayKey === nextStats.dayKey
                    ? (Number(current.dailyScore) || 0) + safeScore
                    : safeScore;
                const weeklyScore = current.weekKey === nextStats.weekKey
                    ? (Number(current.weeklyScore) || 0) + safeScore
                    : safeScore;
                const quizzesTaken = (Number(current.quizzesTaken) || 0) + 1;

                transaction.set(userRef, {
                    username: user.displayName || '익명 학습자',
                    email: user.email,
                    avatar: user.photoURL || '',
                    score: totalScore,
                    totalScore,
                    dailyScore,
                    weeklyScore,
                    quizzesTaken,
                    dayKey: nextStats.dayKey,
                    weekKey: nextStats.weekKey,
                    lastActive: serverTimestamp()
                }, { merge: true });

                transaction.set(profileRef, {
                    displayName: user.displayName || '익명 학습자',
                    avatarUrl: user.photoURL || '',
                    totalScore,
                    dailyScore,
                    weeklyScore,
                    quizzesTaken,
                    dayKey: nextStats.dayKey,
                    weekKey: nextStats.weekKey,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });
        } catch (saveError) {
            console.error('Cloud score save failed; local score is preserved:', saveError);
        }
    };

    const submitAnswer = () => {
        if (selectedAnswer === null || showResult || answerLocked.current) return;
        answerLocked.current = true;
        const question = questions[currentIndex];
        const record: AnswerRecord = {
            question,
            selectedAnswer,
            correct: selectedAnswer === question.correctAnswer
        };
        setRecords((previous) => [...previous, record]);
        if (!record.correct) saveWrongAnswer(record);
        setShowResult(true);
    };

    const goNext = () => {
        if (!showResult) return;
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((index) => index + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            answerLocked.current = false;
            return;
        }

        setQuizComplete(true);
        if (!isRetry) {
            const finalScore = records.filter((record) => record.correct).length * 100;
            void saveScore(finalScore);
        }
    };

    const retryWrongAnswers = () => {
        const wrongQuestions = records.filter((record) => !record.correct).map((record) => record.question);
        if (wrongQuestions.length === 0) return;
        setQuestions(wrongQuestions);
        setIsRetry(true);
        resetProgress();
    };

    if (loading) {
        return <main style={pageStyle}><section style={messageCardStyle}><div style={{ fontSize: '3rem' }}>🧠</div><p>경제 퀴즈를 준비하고 있어요.</p></section></main>;
    }

    if (error || questions.length === 0) {
        return (
            <main style={pageStyle}>
                <section style={messageCardStyle}>
                    <div style={{ fontSize: '3rem' }}>⚠️</div>
                    <h1>퀴즈를 불러오지 못했어요</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{error || '잠시 후 다시 시도해 주세요.'}</p>
                    <button style={primaryButtonStyle} onClick={() => void loadQuiz(difficulty)}>다시 시도</button>
                </section>
            </main>
        );
    }

    const score = records.filter((record) => record.correct).length * 100;
    const wrongRecords = records.filter((record) => !record.correct);

    if (quizComplete) {
        return (
            <main style={pageStyle}>
                <section style={{ ...messageCardStyle, maxWidth: '650px' }}>
                    <div style={{ fontSize: '4rem' }}>{wrongRecords.length === 0 ? '🏆' : '📘'}</div>
                    <h1>{isRetry ? '오답 재도전 완료' : '퀴즈 완료'}</h1>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{score}점</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{records.filter((record) => record.correct).length} / {questions.length}문제 정답</p>
                    {records.map((record, index) => (
                        <div key={`${record.question.id}-${index}`} style={{ textAlign: 'left', padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                            <strong>{record.correct ? '✅' : '❌'} {record.question.question}</strong>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                내 답: {record.question.options[record.selectedAnswer]}
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {wrongRecords.length > 0 && <button style={primaryButtonStyle} onClick={retryWrongAnswers}>오답만 다시 풀기</button>}
                        <button style={secondaryButtonStyle} onClick={() => void loadQuiz(difficulty)}>새 문제 풀기</button>
                    </div>
                    {isRetry && <small style={{ color: 'var(--text-secondary)' }}>오답 재도전은 중복 점수로 합산되지 않습니다.</small>}
                </section>
            </main>
        );
    }

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <main style={pageStyle}>
            <div style={{ width: '100%', maxWidth: '720px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <BackButton />
                    <span style={{ color: 'white', fontWeight: 700 }}>{currentIndex + 1} / {questions.length}</span>
                </header>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {(Object.keys(difficultyLabels) as Difficulty[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => void loadQuiz(level)}
                            disabled={records.length > 0}
                            style={{ ...secondaryButtonStyle, opacity: difficulty === level ? 1 : 0.7, borderColor: difficulty === level ? 'var(--primary)' : 'var(--border-color)' }}
                        >
                            {difficultyLabels[level]}
                        </button>
                    ))}
                    <span style={{ alignSelf: 'center', color: 'white', fontSize: '0.8rem' }}>
                        {source === 'ai' ? 'AI 생성 문제' : source === 'wrong-note' ? '오답 노트 문제' : '검수된 문제'}{isRetry ? ' · 오답 재도전' : ''}
                    </span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.3)', borderRadius: '999px', marginBottom: '1rem' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#ffd166', borderRadius: '999px', transition: 'width .2s' }} />
                </div>
                <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: 'clamp(1.25rem, 4vw, 2.25rem)', boxShadow: 'var(--card-shadow)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{difficultyLabels[question.difficulty]}</span>
                    <h1 style={{ lineHeight: 1.5, fontSize: '1.35rem' }}>{question.question}</h1>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {question.options.map((option, index) => {
                            const selected = selectedAnswer === index;
                            const correct = showResult && question.correctAnswer === index;
                            const wrong = showResult && selected && !correct;
                            return (
                                <button
                                    key={option}
                                    disabled={showResult}
                                    onClick={() => setSelectedAnswer(index)}
                                    style={{
                                        padding: '1rem', textAlign: 'left', borderRadius: '0.85rem', cursor: showResult ? 'default' : 'pointer',
                                        border: `2px solid ${correct ? '#2e7d32' : wrong ? '#c62828' : selected ? 'var(--primary)' : 'var(--border-color)'}`,
                                        background: correct ? 'rgba(46,125,50,.12)' : wrong ? 'rgba(198,40,40,.12)' : 'var(--card-bg)',
                                        color: 'var(--text-primary)', fontSize: '1rem'
                                    }}
                                >
                                    {index + 1}. {option} {correct ? '✓' : wrong ? '✕' : ''}
                                </button>
                            );
                        })}
                    </div>
                    {showResult && (
                        <aside style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(79,172,254,.1)', borderRadius: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{selectedAnswer === question.correctAnswer ? '정답입니다.' : '정답을 확인해 보세요.'}</strong><br />
                            {question.explanation}
                        </aside>
                    )}
                    <button
                        style={{ ...primaryButtonStyle, width: '100%', marginTop: '1rem', opacity: !showResult && selectedAnswer === null ? 0.5 : 1 }}
                        disabled={!showResult && selectedAnswer === null}
                        onClick={showResult ? goNext : submitAnswer}
                    >
                        {showResult ? (currentIndex === questions.length - 1 ? '결과 보기' : '다음 문제') : '답 제출'}
                    </button>
                </section>
            </div>
        </main>
    );
}

const pageStyle: React.CSSProperties = {
    minHeight: '100vh', background: 'var(--bg-gradient)', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
};

const messageCardStyle: React.CSSProperties = {
    width: '100%', maxWidth: '520px', marginTop: '10vh', padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '1.5rem', boxShadow: 'var(--card-shadow)'
};

const primaryButtonStyle: React.CSSProperties = {
    border: 0, borderRadius: '999px', background: 'var(--primary)', color: 'white', padding: '0.85rem 1.25rem', fontWeight: 700, cursor: 'pointer'
};

const secondaryButtonStyle: React.CSSProperties = {
    border: '1px solid var(--border-color)', borderRadius: '999px', background: 'var(--card-bg)', color: 'var(--text-primary)', padding: '0.7rem 1rem', fontWeight: 700, cursor: 'pointer'
};
