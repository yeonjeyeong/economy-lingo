import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const today = new Date();

        // Generate events for the next 7 days
        const generateEvents = () => {
            const events = [];

            // Helper to create date strings
            const getDateStr = (daysFromNow: number) => {
                const date = new Date(today);
                date.setDate(date.getDate() + daysFromNow);
                return date.toISOString().split('T')[0];
            };

            // Day 0 (Today) - High importance events
            events.push(
                {
                    id: 'evt-today-1',
                    date: getDateStr(0),
                    time: '10:00',
                    title: '한국은행 기준금리 발표',
                    country: '한국',
                    importance: 3
                },
                {
                    id: 'evt-today-2',
                    date: getDateStr(0),
                    time: '22:30',
                    title: '미국 비농업 고용지표 (NFP)',
                    country: '미국',
                    importance: 3
                },
                {
                    id: 'evt-today-3',
                    date: getDateStr(0),
                    time: '16:00',
                    title: '한국 소비자물가지수 (CPI)',
                    country: '한국',
                    importance: 2
                }
            );

            // Day 1 (Tomorrow)
            events.push(
                {
                    id: 'evt-day1-1',
                    date: getDateStr(1),
                    time: '10:30',
                    title: '중국 제조업 구매관리자지수 (PMI)',
                    country: '중국',
                    importance: 2
                },
                {
                    id: 'evt-day1-2',
                    date: getDateStr(1),
                    time: '18:00',
                    title: '유럽중앙은행 (ECB) 통화정책 회의',
                    country: '유럽',
                    importance: 3
                },
                {
                    id: 'evt-day1-3',
                    date: getDateStr(1),
                    time: '09:00',
                    title: '한국 무역수지',
                    country: '한국',
                    importance: 2
                }
            );

            // Day 2
            events.push(
                {
                    id: 'evt-day2-1',
                    date: getDateStr(2),
                    time: '23:00',
                    title: '미국 ISM 제조업지수',
                    country: '미국',
                    importance: 2
                },
                {
                    id: 'evt-day2-2',
                    date: getDateStr(2),
                    time: '08:50',
                    title: '일본 GDP 성장률 (분기)',
                    country: '일본',
                    importance: 2
                },
                {
                    id: 'evt-day2-3',
                    date: getDateStr(2),
                    time: '15:00',
                    title: '한국 산업생산지수',
                    country: '한국',
                    importance: 1
                }
            );

            // Day 3
            events.push(
                {
                    id: 'evt-day3-1',
                    date: getDateStr(3),
                    time: '22:30',
                    title: '미국 소비자물가지수 (CPI)',
                    country: '미국',
                    importance: 3
                },
                {
                    id: 'evt-day3-2',
                    date: getDateStr(3),
                    time: '17:00',
                    title: '영국 소매판매',
                    country: '영국',
                    importance: 2
                },
                {
                    id: 'evt-day3-3',
                    date: getDateStr(3),
                    time: '11:00',
                    title: '중국 소비자물가지수 (CPI)',
                    country: '중국',
                    importance: 2
                }
            );

            // Day 4
            events.push(
                {
                    id: 'evt-day4-1',
                    date: getDateStr(4),
                    time: '23:00',
                    title: '미국 소비자신뢰지수',
                    country: '미국',
                    importance: 2
                },
                {
                    id: 'evt-day4-2',
                    date: getDateStr(4),
                    time: '18:00',
                    title: '독일 IFO 기업경기지수',
                    country: '독일',
                    importance: 2
                },
                {
                    id: 'evt-day4-3',
                    date: getDateStr(4),
                    time: '14:00',
                    title: '한국 설비투자지수',
                    country: '한국',
                    importance: 1
                }
            );

            // Day 5
            events.push(
                {
                    id: 'evt-day5-1',
                    date: getDateStr(5),
                    time: '22:30',
                    title: '미국 GDP 성장률 (분기)',
                    country: '미국',
                    importance: 3
                },
                {
                    id: 'evt-day5-2',
                    date: getDateStr(5),
                    time: '09:00',
                    title: '한국 실업률',
                    country: '한국',
                    importance: 2
                },
                {
                    id: 'evt-day5-3',
                    date: getDateStr(5),
                    time: '08:30',
                    title: '일본 소비자물가지수 (CPI)',
                    country: '일본',
                    importance: 2
                }
            );

            // Day 6
            events.push(
                {
                    id: 'evt-day6-1',
                    date: getDateStr(6),
                    time: '10:00',
                    title: '중국 소매판매',
                    country: '중국',
                    importance: 2
                },
                {
                    id: 'evt-day6-2',
                    date: getDateStr(6),
                    time: '16:00',
                    title: '유로존 제조업 PMI',
                    country: '유럽',
                    importance: 2
                },
                {
                    id: 'evt-day6-3',
                    date: getDateStr(6),
                    time: '13:00',
                    title: '한국 건설수주',
                    country: '한국',
                    importance: 1
                }
            );

            return events;
        };

        const schedule = generateEvents();

        console.log(`Returning ${schedule.length} calendar events for next 7 days`);
        return NextResponse.json({ schedule });
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }
}
