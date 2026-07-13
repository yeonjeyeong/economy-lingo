import { NextResponse } from 'next/server';

interface LearningEvent {
    id: string;
    date: string;
    time: string;
    title: string;
    country: string;
    importance: number;
    category: 'learning';
}

const weeklyPlan = [
    { weekday: 1, time: '20:00', title: '이번 주 핵심 경제용어 복습', importance: 2 },
    { weekday: 3, time: '20:00', title: '경제지표 읽기 연습', importance: 2 },
    { weekday: 5, time: '20:00', title: '주간 경제 뉴스 정리', importance: 1 },
    { weekday: 0, time: '10:00', title: '주간 경제 퀴즈 도전', importance: 3 }
] as const;

function dateKey(year: number, monthIndex: number, day: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildLearningSchedule(year: number, monthIndex: number): LearningEvent[] {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const events: LearningEvent[] = [];

    for (let day = 1; day <= lastDay; day += 1) {
        const weekday = new Date(year, monthIndex, day).getDay();
        for (const plan of weeklyPlan) {
            if (weekday !== plan.weekday) continue;
            events.push({
                id: `learning-${year}-${monthIndex + 1}-${day}-${plan.weekday}`,
                date: dateKey(year, monthIndex, day),
                time: plan.time,
                title: plan.title,
                country: '학습 추천',
                importance: plan.importance,
                category: 'learning'
            });
        }
    }
    return events;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const rawYear = searchParams.get('year');
    const rawMonth = searchParams.get('month');
    const year = rawYear === null ? now.getFullYear() : Number(rawYear);
    const month = rawMonth === null ? now.getMonth() + 1 : Number(rawMonth);

    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
        return NextResponse.json(
            { error: 'year는 2000~2100, month는 1~12 범위의 정수여야 합니다.' },
            { status: 400 }
        );
    }

    return NextResponse.json({
        schedule: buildLearningSchedule(year, month - 1),
        kind: 'recurring-learning-plan',
        disclaimer: '표시된 일정은 학습을 돕기 위한 반복 추천이며 실제 경제지표 발표 일정이 아닙니다.'
    });
}
