import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Mock community posts
        const posts = [
            {
                id: '1',
                title: '한국은행 기준금리 동결, 여러분 생각은 어떠세요?',
                content: '오늘 한국은행이 기준금리를 3.50%로 동결했는데요, 물가는 아직 높은데 금리를 동결한 이유가 뭘까요? 여러분의 의견을 들어보고 싶습니다.',
                author: '경제왕김철수',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                views: 342,
                comments: 15
            },
            {
                id: '2',
                title: '주식 투자 초보인데 어떤 섹터부터 시작하면 좋을까요?',
                content: '경제 공부를 시작한 지 얼마 안 됐는데요, 이제 실전 투자도 해보고 싶어요. 반도체, 자동차, 금융주 중에 어떤 섹터가 초보자에게 적합할까요?',
                author: '재테크마스터',
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                views: 587,
                comments: 23
            },
            {
                id: '3',
                title: 'GDP와 GNP의 차이를 쉽게 설명해주실 분?',
                content: '퀴즈 풀다가 헷갈려서요... 두 개념이 비슷한 것 같으면서도 다른데, 누가 쉽게 설명 좀 해주실 수 있나요?',
                author: '경제초보학생',
                createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                views: 421,
                comments: 18
            },
            {
                id: '4',
                title: '환율 상승이 수출기업에 유리한 이유',
                content: '경제 뉴스를 보다가 궁금한 점이 생겼어요. 왜 원화 가치가 떨어지면(환율 상승) 수출 기업에게 유리하다고 하는 걸까요? 자세히 설명해주시면 감사하겠습니다!',
                author: '투자전문가정수',
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                views: 634,
                comments: 31
            },
            {
                id: '5',
                title: '퀴즈 만점 받는 팁 공유합니다! 📚',
                content: '저는 매일 퀴즈 풀면서 정리 노트를 만들고 있는데요, 몇 가지 팁을 공유하고 싶어 글 올립니다. 1) 경제 용어는 영어 약자를 먼저 외우기 2) 관련 뉴스와 연결해서 이해하기 3) 오답 노트 꼭 복습하기...',
                author: '경제박사이민수',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                views: 892,
                comments: 45
            }
        ];

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Community API error:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}
