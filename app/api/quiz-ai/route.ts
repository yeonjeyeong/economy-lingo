import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

function isValidQuestion(value: unknown): value is Omit<QuizQuestion, 'id' | 'difficulty'> {
    if (!value || typeof value !== 'object') return false;
    const question = value as Record<string, unknown>;
    return typeof question.question === 'string'
        && question.question.trim().length >= 5
        && Array.isArray(question.options)
        && question.options.length === 4
        && question.options.every((option) => typeof option === 'string' && option.trim().length > 0)
        && Number.isInteger(question.correctAnswer)
        && Number(question.correctAnswer) >= 0
        && Number(question.correctAnswer) < 4
        && typeof question.explanation === 'string'
        && question.explanation.trim().length >= 5;
}

function curatedFallback(difficulty: QuizDifficulty, count: number): QuizQuestion[] {
    return shuffle(quizQuestions.filter((question) => question.difficulty === difficulty)).slice(0, count);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawDifficulty = searchParams.get('difficulty') ?? 'medium';
    const rawCount = searchParams.get('count') ?? '5';
    const count = Number(rawCount);

    if (!difficulties.includes(rawDifficulty as QuizDifficulty)) {
        return NextResponse.json(
            { error: 'difficulty는 easy, medium, hard 중 하나여야 합니다.' },
            { status: 400 }
        );
    }

    if (!Number.isInteger(count) || count < 1 || count > 6) {
        return NextResponse.json(
            { error: 'count는 1 이상 6 이하의 정수여야 합니다.' },
            { status: 400 }
        );
    }

    const difficulty = rawDifficulty as QuizDifficulty;
    const fallback = curatedFallback(difficulty, count);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ questions: fallback, source: 'curated' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const prompt = [
            `한국어 경제 용어 객관식 문제를 정확히 ${count}개 만드세요.`,
            `난이도는 ${difficulty}이며, 각 문제에는 서로 다른 보기 4개가 있어야 합니다.`,
            '사실관계가 명확하고 정답이 하나뿐인 문제만 작성하세요.',
            '마크다운 없이 다음 JSON 배열 형식만 반환하세요:',
            '[{"question":"질문","options":["보기1","보기2","보기3","보기4"],"correctAnswer":0,"explanation":"해설"}]'
        ].join('\n');

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
        const parsed: unknown = JSON.parse(text);

        if (!Array.isArray(parsed) || parsed.length !== count || !parsed.every(isValidQuestion)) {
            throw new Error('AI가 유효하지 않은 문제 형식을 반환했습니다.');
        }

        const questions: QuizQuestion[] = parsed.map((question, index) => ({
            ...question,
            id: Date.now() + index,
            options: question.options as [string, string, string, string],
            difficulty
        }));

        return NextResponse.json({ questions, source: 'ai' });
    } catch (error) {
        console.error('Quiz AI fallback:', error);
        return NextResponse.json({ questions: fallback, source: 'curated' });
    }
}
