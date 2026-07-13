'use client';

import BackButton from '@/components/BackButton';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    selectedAnswer?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation: string;
}

const difficultyLabels = { easy: '쉬움', medium: '보통', hard: '어려움' } as const;

export default function WrongAnswersPage() {
    const router = useRouter();
    const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | QuizQuestion['difficulty']>('all');
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [storageError, setStorageError] = useState('');

    useEffect(() => {
        let nextAnswers: QuizQuestion[] = [];
        let nextError = '';
        try {
            const saved = localStorage.getItem('wrongAnswers');
            const parsed = saved ? JSON.parse(saved) : [];
            nextAnswers = Array.isArray(parsed) ? parsed : [];
        } catch {
            nextError = '오답 기록을 읽지 못했습니다. 브라우저 저장소를 확인해 주세요.';
        }
        queueMicrotask(() => {
            setWrongAnswers(nextAnswers);
            setStorageError(nextError);
            setLoading(false);
        });
    }, []);

    const persist = (next: QuizQuestion[]) => {
        try {
            localStorage.setItem('wrongAnswers', JSON.stringify(next));
            setWrongAnswers(next);
            setStorageError('');
        } catch {
            setStorageError('변경 사항을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
        }
    };

    const visibleAnswers = useMemo(
        () => filter === 'all' ? wrongAnswers : wrongAnswers.filter((item) => item.difficulty === filter),
        [filter, wrongAnswers],
    );

    const removeAnswer = (question: QuizQuestion, index: number) => {
        persist(wrongAnswers.filter((item, itemIndex) =>
            item.id !== question.id || (item.id === question.id && itemIndex !== index),
        ));
    };

    const clearWrongAnswers = () => {
        persist([]);
        setConfirmingClear(false);
    };

    return (
        <div className="wrong-page">
            <div className="wrong-page__inner">
                <header className="wrong-page__header">
                    <div>
                        <BackButton />
                        <div>
                            <p>REVIEW & RETRY</p>
                            <h1>오답 노트</h1>
                        </div>
                    </div>
                    {wrongAnswers.length > 0 && (
                        <div className="wrong-page__actions">
                            <button className="button button-primary" onClick={() => router.push('/quiz?retry=wrong')}>
                                오답만 다시 풀기
                            </button>
                            <button className="button" onClick={() => setConfirmingClear(true)}>전체 지우기</button>
                        </div>
                    )}
                </header>

                {storageError && <p className="wrong-page__error" role="alert">{storageError}</p>}

                {confirmingClear && (
                    <section className="wrong-page__confirm" role="alertdialog" aria-labelledby="clear-title">
                        <div>
                            <strong id="clear-title">오답 기록을 모두 지울까요?</strong>
                            <p>삭제한 기록은 복구할 수 없습니다.</p>
                        </div>
                        <div>
                            <button className="button" onClick={() => setConfirmingClear(false)}>취소</button>
                            <button className="button wrong-page__danger" onClick={clearWrongAnswers}>모두 삭제</button>
                        </div>
                    </section>
                )}

                {wrongAnswers.length > 0 && (
                    <div className="wrong-page__filters" role="group" aria-label="난이도 필터">
                        {(['all', 'easy', 'medium', 'hard'] as const).map((value) => (
                            <button
                                key={value}
                                className={filter === value ? 'is-active' : ''}
                                onClick={() => setFilter(value)}
                                aria-pressed={filter === value}
                            >
                                {value === 'all' ? `전체 ${wrongAnswers.length}` : difficultyLabels[value]}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <section className="wrong-page__empty" aria-live="polite">오답 기록을 불러오는 중…</section>
                ) : wrongAnswers.length === 0 ? (
                    <section className="wrong-page__empty">
                        <span aria-hidden="true">✓</span>
                        <h2>아직 저장된 오답이 없어요</h2>
                        <p>퀴즈에서 틀린 문제는 선택한 답과 함께 이곳에 자동으로 저장됩니다.</p>
                        <button className="button button-primary" onClick={() => router.push('/quiz')}>퀴즈 풀러 가기</button>
                    </section>
                ) : visibleAnswers.length === 0 ? (
                    <section className="wrong-page__empty">
                        <h2>이 난이도의 오답이 없어요</h2>
                        <button className="button" onClick={() => setFilter('all')}>전체 보기</button>
                    </section>
                ) : (
                    <div className="wrong-list">
                        {visibleAnswers.map((question, index) => (
                            <article className="wrong-card" key={`${question.id}-${index}`}>
                                <div className="wrong-card__top">
                                    <span className={`difficulty difficulty--${question.difficulty}`}>
                                        {difficultyLabels[question.difficulty]}
                                    </span>
                                    <button
                                        className="wrong-card__remove"
                                        onClick={() => removeAnswer(question, wrongAnswers.indexOf(question))}
                                        aria-label={`오답 기록 삭제: ${question.question}`}
                                    >
                                        삭제
                                    </button>
                                </div>
                                <h2>{question.question}</h2>
                                <ol className="wrong-options">
                                    {question.options.map((option, optionIndex) => {
                                        const correct = optionIndex === question.correctAnswer;
                                        const selectedWrong = optionIndex === question.selectedAnswer && !correct;
                                        return (
                                            <li
                                                key={option}
                                                className={`${correct ? 'is-correct' : ''}${selectedWrong ? ' is-selected-wrong' : ''}`}
                                            >
                                                <span>{optionIndex + 1}</span>
                                                <span>{option}</span>
                                                {correct && <strong>정답</strong>}
                                                {selectedWrong && <strong>내가 고른 답</strong>}
                                            </li>
                                        );
                                    })}
                                </ol>
                                <aside className="wrong-card__explanation">
                                    <strong>해설</strong>
                                    <p>{question.explanation}</p>
                                </aside>
                            </article>
                        ))}
                    </div>
                )}
                <p className="wrong-page__storage-note">오답 노트는 현재 이 브라우저에 저장됩니다.</p>
            </div>
        </div>
    );
}
