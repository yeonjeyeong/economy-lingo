import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'daily';

        // Mock ranking data
        const generateRankings = (type: string) => {
            const names = [
                '경제왕김철수', '재테크마스터', '주식고수박영희', '경제박사이민수',
                '투자전문가정수', '금융왕최지훈', '경제전문가홍길동', '재무분석가윤서연',
                '시장분석가강민지', '경제학도이준호'
            ];

            return names.map((name, index) => ({
                rank: index + 1,
                username: name,
                score: type === 'daily' ? 950 - (index * 50) :
                    type === 'weekly' ? 6500 - (index * 400) :
                        25000 - (index * 1500),
                quizzesTaken: type === 'daily' ? 19 - index :
                    type === 'weekly' ? 130 - (index * 10) :
                        500 - (index * 30),
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            }));
        };

        const rankings = generateRankings(period);

        return NextResponse.json({
            period,
            rankings,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ranking API error:', error);
        return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
    }
}
