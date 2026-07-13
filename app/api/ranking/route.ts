import { NextResponse } from 'next/server';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

const metrics = {
    daily: 'dailyScore',
    weekly: 'weeklyScore',
    all: 'totalScore'
} as const;

type RankingPeriod = keyof typeof metrics;

function seoulDateKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
}

function weekKeyFromDateKey(dateKey: string): string {
    const [year, month, date] = dateKey.split('-').map(Number);
    const day = new Date(year, month - 1, date);
    const weekday = day.getDay() || 7;
    day.setDate(day.getDate() + 4 - weekday);
    const yearStart = new Date(day.getFullYear(), 0, 1);
    const week = Math.ceil((((day.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${day.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? 'daily';

    if (!(period in metrics)) {
        return NextResponse.json(
            { error: 'period는 daily, weekly, all 중 하나여야 합니다.' },
            { status: 400 }
        );
    }

    const typedPeriod = period as RankingPeriod;
    const metric = metrics[typedPeriod];
    const dayKey = seoulDateKey();
    const weekKey = weekKeyFromDateKey(dayKey);

    if (!isFirebaseConfigured) {
        return NextResponse.json({
            period: typedPeriod,
            metric,
            rankings: [],
            unavailable: true,
            notice: '공개 랭킹 저장소가 설정되지 않아 기기 내 기록을 사용합니다.'
        });
    }

    try {
        const rankingQuery = query(
            collection(db, 'publicProfiles'),
            orderBy(metric, 'desc'),
            limit(50)
        );
        const snapshot = await getDocs(rankingQuery);
        const rankings = snapshot.docs
            .map((profile) => {
                const data = profile.data();
                const isCurrentPeriod = typedPeriod === 'daily'
                    ? data.dayKey === dayKey
                    : typedPeriod === 'weekly'
                        ? data.weekKey === weekKey
                        : true;
                return {
                    displayName: typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : '익명 학습자',
                    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : '',
                    score: isCurrentPeriod ? Math.max(0, Number(data[metric]) || 0) : 0,
                    quizzesTaken: Math.max(0, Number(data.quizzesTaken) || 0)
                };
            })
            .filter((user) => user.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((user, index) => ({ ...user, id: `rank-${index + 1}`, rank: index + 1 }));

        return NextResponse.json({
            period: typedPeriod,
            metric,
            rankings,
            unavailable: false,
            notice: '랭킹은 이메일이 없는 공개 프로필의 학습 점수만 사용합니다.'
        });
    } catch (error) {
        console.error('Public ranking query failed:', error);
        return NextResponse.json(
            { error: '공개 랭킹에 연결하지 못했습니다.', rankings: [] },
            { status: 503 }
        );
    }
}
