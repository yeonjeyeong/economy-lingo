import { NextResponse } from 'next/server';
import { quizQuestions, type QuizDifficulty, type QuizQuestion } from '@/data/quizData';

const difficulties: QuizDifficulty[] = ['easy', 'medium', 'hard'];

function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawDifficulty = searchParams.get('difficulty');
    const rawCount = searchParams.get('count') ?? '5';
    const count = Number(rawCount);

    if (rawDifficulty && !difficulties.includes(rawDifficulty as QuizDifficulty)) {
        return NextResponse.json(
            { error: 'difficulty는 easy, medium, hard 중 하나여야 합니다.' },
            { status: 400 }
        );
    }

    if (!Number.isInteger(count) || count < 1 || count > 10) {
        return NextResponse.json(
            { error: 'count는 1 이상 10 이하의 정수여야 합니다.' },
            { status: 400 }
        );
    }

    const difficulty = rawDifficulty as QuizDifficulty | null;
    const pool: QuizQuestion[] = difficulty
        ? quizQuestions.filter((question) => question.difficulty === difficulty)
        : quizQuestions;

    if (count > pool.length) {
        return NextResponse.json(
            { error: `선택한 난이도에서 요청할 수 있는 최대 문제 수는 ${pool.length}개입니다.` },
            { status: 400 }
        );
    }

    return NextResponse.json({
        questions: shuffle(pool).slice(0, count),
        source: 'curated'
    });
}
