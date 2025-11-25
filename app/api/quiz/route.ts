import { NextResponse } from 'next/server';
import { quizQuestions } from '@/data/quizData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const difficulty = searchParams.get('difficulty');
        const count = parseInt(searchParams.get('count') || '5');

        let questions = [...quizQuestions];

        // Filter by difficulty if specified
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            questions = questions.filter(q => q.difficulty === difficulty);
        }

        // Shuffle and select random questions
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));

        return NextResponse.json({ questions: selected });
    } catch (error) {
        console.error('Quiz API error:', error);
        return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 });
    }
}
