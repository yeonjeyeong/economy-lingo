import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 900;

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    company: string;
    date: string;
    tags: string[];
    isFallback?: boolean;
}

const STOCK_NAMES: Record<string, string> = {
    '005930': '삼성전자',
    '005380': '현대자동차',
    '000660': 'SK하이닉스',
    '035420': 'NAVER'
};

const LEARNING_FALLBACK: NewsItem[] = [
    {
        id: 'learning-base-rate',
        title: '기준금리가 경제에 미치는 영향을 퀴즈로 복습해 보세요',
        summary: '뉴스를 잠시 불러오지 못했습니다. 금리, 물가, 환율의 관계를 경제 퀴즈로 익힐 수 있어요.',
        url: '/quiz',
        company: '경제링고 학습 콘텐츠',
        date: '',
        tags: ['경제학습', '금리'],
        isFallback: true
    },
    {
        id: 'learning-market',
        title: '주식과 금융시장 기초 개념을 확인해 보세요',
        summary: '실시간 뉴스가 복구되는 동안 핵심 경제 용어를 문제로 풀며 학습할 수 있어요.',
        url: '/quiz',
        company: '경제링고 학습 콘텐츠',
        date: '',
        tags: ['경제학습', '금융시장'],
        isFallback: true
    }
];

function cleanText(value: string) {
    const decoded = cheerio.load(`<div>${value}</div>`).root().text();
    return decoded.replace(/\s+/g, ' ').trim();
}

function fallbackResponse(message: string) {
    return NextResponse.json(
        { news: LEARNING_FALLBACK, fallback: true, message },
        {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900'
            }
        }
    );
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get('stock');
    const query = stockCode && STOCK_NAMES[stockCode] ? STOCK_NAMES[stockCode] : '경제 금융';
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

    try {
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'EconomyLingo/1.0 (+https://economy-lingo.vercel.app)' },
            next: { revalidate: 900 },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`Google News RSS responded with ${response.status}`);
        }

        const xmlData = await response.text();
        const $ = cheerio.load(xmlData, { xmlMode: true });
        const news: NewsItem[] = [];

        $('item').slice(0, 10).each((index, element) => {
            const title = cleanText($(element).find('title').text());
            const url = cleanText($(element).find('link').text());
            if (!title || !/^https?:\/\//i.test(url)) return;

            const source = cleanText($(element).find('source').text());
            const summary = cleanText($(element).find('description').text());
            const publishedAt = new Date($(element).find('pubDate').text());

            news.push({
                id: `${publishedAt.getTime() || index}-${url}`,
                title,
                summary,
                url,
                company: source || 'Google 뉴스',
                date: Number.isNaN(publishedAt.getTime()) ? '' : publishedAt.toISOString().slice(0, 10),
                tags: stockCode && STOCK_NAMES[stockCode]
                    ? ['종목뉴스', STOCK_NAMES[stockCode]]
                    : ['경제', '뉴스']
            });
        });

        if (news.length === 0) {
            return fallbackResponse('새 뉴스를 찾지 못해 학습 콘텐츠를 표시합니다.');
        }

        return NextResponse.json(
            { news, fallback: false },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600'
                }
            }
        );
    } catch (error) {
        console.error('News API error:', error);
        return fallbackResponse('뉴스 연결이 원활하지 않아 학습 콘텐츠를 표시합니다. 잠시 후 다시 시도해 주세요.');
    }
}
