import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stockCode = searchParams.get('stock');

        const stockNames: Record<string, string> = {
            '005930': '삼성전자',
            '005380': '현대차',
            '000660': 'SK하이닉스',
            '035420': 'NAVER'
        };

        let query = '경제 금융';
        if (stockCode && stockNames[stockCode]) {
            query = stockNames[stockCode];
        }

        // Google News RSS URL (Korean)
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

        const response = await fetch(rssUrl);
        const xmlData = await response.text();

        const $ = cheerio.load(xmlData, { xmlMode: true });
        const newsItems: any[] = [];

        $('item').each((i, elem) => {
            if (i >= 10) return false; // Limit to 10 items

            const title = $(elem).find('title').text();
            const link = $(elem).find('link').text();
            const pubDate = $(elem).find('pubDate').text();
            const description = $(elem).find('description').text();
            const source = $(elem).find('source').text();

            // Clean up description (remove HTML tags if any, though RSS usually has plain text or CDATA)
            const cleanDescription = description.replace(/<[^>]*>?/gm, '');

            // Format date
            const dateObj = new Date(pubDate);
            const formattedDate = isNaN(dateObj.getTime())
                ? new Date().toISOString().split('T')[0]
                : dateObj.toISOString().split('T')[0];

            newsItems.push({
                id: link, // Use link as unique ID
                title: title,
                summary: cleanDescription,
                url: link,
                company: source || 'Google News',
                date: formattedDate,
                tags: stockCode ? ['종목뉴스', query] : ['경제', '뉴스']
            });
        });

        console.log(`Fetched ${newsItems.length} news items for query: ${query}`);
        return NextResponse.json({ news: newsItems });
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
