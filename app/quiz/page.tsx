'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: string;
    explanation: string;
}

export default function QuizPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizComplete, setQuizComplete] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const res = await fetch('/api/quiz-ai?count=5&difficulty=medium');
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Failed to fetch quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveScore = async (finalScore: number) => {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);

        try {
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    score: increment(finalScore),
                    quizzesTaken: increment(1),
                    lastActive: serverTimestamp()
                });
            } else {
                await setDoc(userRef, {
                    username: user.displayName || 'Anonymous',
                    email: user.email,
                    avatar: user.photoURL || '',
                    score: finalScore,
                    quizzesTaken: 1,
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp()
                });
            }
            console.log('Score saved successfully');
        } catch (error) {
            console.error('Error saving score:', error);
        }
    };

    const handleAnswer = () => {
        if (selectedAnswer === null) return;

        const currentQuestion = questions[currentIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        if (isCorrect) {
            setScore(prev => prev + 100);
            setCorrectAnswersCount(prev => prev + 1);
        } else {
            setScore(prev => prev - 50);
            const newWrongAnswers = [...wrongAnswers, currentQuestion];
            setWrongAnswers(newWrongAnswers);

            // Save to local storage for wrong answer note
            const saved = localStorage.getItem('wrongAnswers');
            const existingWrong = saved ? JSON.parse(saved) : [];
            // Avoid duplicates based on question text
            if (!existingWrong.some((q: QuizQuestion) => q.question === currentQuestion.question)) {
                existingWrong.push(currentQuestion);
                localStorage.setItem('wrongAnswers', JSON.stringify(existingWrong));
            }
        }

        setShowResult(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setQuizComplete(true);
            saveScore(score);
        }
    };

    const restartQuiz = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setCorrectAnswersCount(0);
        setWrongAnswers([]);
        setQuizComplete(false);
        fetchQuiz();
    };

    if (loading) {
        return (
            <div style={{
                background: 'var(--bg-gradient)',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s ease'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>🦉</div>
                    <p style={{ color: 'white', fontSize: '1.2rem' }}>퀴즈를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', padding: '2rem', transition: 'background 0.3s ease' }}>
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😢</div>
                    <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '2rem' }}>퀴즈를 불러올 수 없습니다.</p>
                    <button onClick={() => router.push('/')} style={{
                        background: 'var(--card-bg)',
                        color: 'var(--primary)',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--card-shadow)'
                    }}>
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (quizComplete) {
        const percentage = (correctAnswersCount / questions.length) * 100;
        return (
            <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }}>
                <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '2rem',
                        padding: '3rem 2rem',
                        boxShadow: 'var(--card-shadow)',
                        animation: 'scaleIn 0.5s ease-out',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
                            {percentage === 100 ? '🎉' : percentage >= 60 ? '😊' : '😅'}
                        </div>
                        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            {percentage === 100 ? '완벽해요!' : percentage >= 60 ? '잘했어요!' : '다시 도전!'}
                        </h1>
                        <div style={{
                            fontSize: '4rem',
                            fontWeight: 'bold',
                            background: score >= 0 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '2rem'
                        }}>
                            {score} 점
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            ({correctAnswersCount} / {questions.length} 문제 정답)
                        </p>
                        {wrongAnswers.length > 0 && (
                            <div style={{
                                background: 'rgba(255, 251, 240, 0.1)', // Slight transparency for dark mode compatibility
                                border: '2px solid #ffd700',
                                borderRadius: '1rem',
                                padding: '1rem',
                                marginBottom: '2rem'
                            }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                    📝 오답 {wrongAnswers.length}개가 오답 노트에 저장되었어요!
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={restartQuiz} style={{
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'transform 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                🔄 다시 풀기
                            </button>
                            <button onClick={() => router.push('/')} style={{
                                background: 'var(--card-bg)',
                                color: 'var(--text-secondary)',
                                border: '2px solid var(--border-color)',
                                padding: '1rem 2rem',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                🏠 홈으로
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', padding: '1.5rem', transition: 'background 0.3s ease' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <BackButton />
                    <div style={{ color: 'white', fontWeight: 'bold' }}>
                        {currentIndex + 1} / {questions.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                    marginBottom: '2rem',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '9999px',
                    height: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                        borderRadius: '9999px',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 10px rgba(255,215,0,0.6)'
                    }}></div>
                </div>

                {/* Question Card */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '1.5rem',
                    padding: '2.5rem 2rem',
                    boxShadow: 'var(--card-shadow)',
                    animation: 'slideUp 0.4s ease-out',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        background: currentQuestion.difficulty === 'easy' ? 'rgba(46, 125, 50, 0.1)' : currentQuestion.difficulty === 'medium' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                        color: currentQuestion.difficulty === 'easy' ? '#2e7d32' : currentQuestion.difficulty === 'medium' ? '#f57c00' : '#c62828',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        display: 'inline-block',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginBottom: '1.5rem'
                    }}>
                        {currentQuestion.difficulty === 'easy' ? '🟢 쉬움' : currentQuestion.difficulty === 'medium' ? '🟡 보통' : '🔴 어려움'}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', marginBottom: '2rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                        {currentQuestion.question}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrect = index === currentQuestion.correctAnswer;
                            const showCorrect = showResult && isCorrect;
                            const showWrong = showResult && isSelected && !isCorrect;

                            return (
                                <button
                                    key={index}
                                    onClick={() => !showResult && setSelectedAnswer(index)}
                                    disabled={showResult}
                                    style={{
                                        padding: '1.25rem',
                                        textAlign: 'left',
                                        border: showResult
                                            ? (showCorrect ? '3px solid #4caf50' : showWrong ? '3px solid #f44336' : '3px solid var(--border-color)')
                                            : (isSelected ? '3px solid var(--primary)' : '3px solid var(--border-color)'),
                                        borderRadius: '1rem',
                                        background: showResult
                                            ? (showCorrect ? 'rgba(76, 175, 80, 0.1)' : showWrong ? 'rgba(244, 67, 54, 0.1)' : 'var(--card-bg)')
                                            : (isSelected ? 'rgba(79, 172, 254, 0.1)' : 'var(--card-bg)'),
                                        color: 'var(--text-primary)',
                                        cursor: showResult ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.05rem',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        position: 'relative',
                                        transform: isSelected && !showResult ? 'scale(1.02)' : 'scale(1)',
                                        boxShadow: isSelected && !showResult ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!showResult && !isSelected) {
                                            e.currentTarget.style.background = 'var(--border-color)';
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showResult && !isSelected) {
                                            e.currentTarget.style.background = 'var(--card-bg)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{option}</span>
                                        {showCorrect && <span style={{ fontSize: '1.5rem' }}>✓</span>}
                                        {showWrong && <span style={{ fontSize: '1.5rem' }}>✗</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {showResult && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.25rem',
                            background: selectedAnswer === currentQuestion.correctAnswer ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                            borderRadius: '1rem',
                            borderLeft: `5px solid ${selectedAnswer === currentQuestion.correctAnswer ? '#4caf50' : '#ff9800'}`,
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                                    {selectedAnswer === currentQuestion.correctAnswer ? '🎉' : '💡'}
                                </span>
                                <p style={{ fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                                    {selectedAnswer === currentQuestion.correctAnswer ? '정답이에요!' : '아쉬워요!'}
                                </p>
                            </div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={!showResult ? handleAnswer : handleNext}
                        disabled={!showResult && selectedAnswer === null}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            marginTop: '1.5rem',
                            background: (!showResult && selectedAnswer === null)
                                ? 'var(--border-color)'
                                : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '9999px',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: (!showResult && selectedAnswer === null) ? 'not-allowed' : 'pointer',
                            boxShadow: (!showResult && selectedAnswer === null) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s',
                            opacity: (!showResult && selectedAnswer === null) ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (showResult || selectedAnswer !== null) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = (!showResult && selectedAnswer === null) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)';
                        }}
                    >
                        {!showResult ? '답안 제출' : currentIndex < questions.length - 1 ? '다음 문제 →' : '결과 보기 🎯'}
                    </button>
                </div>

                <style jsx>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
            </div>
        </div >
    );
}
