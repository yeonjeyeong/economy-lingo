'use client';

import BackButton from '@/components/BackButton';
import { useEffect, useMemo, useState } from 'react';

type EventCategory = 'learning' | 'user';

interface CalendarEvent {
    id: string;
    date: string;
    time: string;
    title: string;
    country: string;
    importance: number;
    category: EventCategory;
}

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const storageKey = 'economyLingoCalendarEvents';

function localDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fallbackSchedule(year: number, monthIndex: number): CalendarEvent[] {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const events: CalendarEvent[] = [];
    for (let day = 1; day <= lastDay; day += 1) {
        const weekday = new Date(year, monthIndex, day).getDay();
        if (weekday === 1 || weekday === 0) {
            events.push({
                id: `offline-${year}-${monthIndex}-${day}`,
                date: localDateKey(new Date(year, monthIndex, day)),
                time: weekday === 1 ? '20:00' : '10:00',
                title: weekday === 1 ? '주간 경제용어 복습' : '주간 경제 퀴즈 도전',
                country: '오프라인 학습 추천',
                importance: weekday === 1 ? 2 : 3,
                category: 'learning'
            });
        }
    }
    return events;
}

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [learningEvents, setLearningEvents] = useState<CalendarEvent[]>([]);
    const [userEvents, setUserEvents] = useState<CalendarEvent[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as CalendarEvent[];
            return Array.isArray(saved) ? saved.filter((event) => event.category === 'user') : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('20:00');

    useEffect(() => {
        let cancelled = false;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;

        const fetchSchedule = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/calendar?year=${year}&month=${month}`, { cache: 'no-store' });
                const data = await response.json() as { schedule?: CalendarEvent[]; error?: string };
                if (!response.ok || !Array.isArray(data.schedule)) throw new Error(data.error || '학습 일정을 불러오지 못했습니다.');
                if (!cancelled) setLearningEvents(data.schedule);
            } catch (scheduleError) {
                console.error('Calendar fallback:', scheduleError);
                if (!cancelled) {
                    setLearningEvents(fallbackSchedule(year, month - 1));
                    setError('온라인 일정을 불러오지 못해 기기에서 만든 기본 학습 계획을 표시합니다.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchSchedule();
        return () => { cancelled = true; };
    }, [currentMonth]);

    const events = useMemo(() => [...learningEvents, ...userEvents], [learningEvents, userEvents]);
    const selectedKey = localDateKey(selectedDate);
    const selectedEvents = events.filter((event) => event.date === selectedKey);

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const cells: Array<number | null> = Array(new Date(year, month, 1).getDay()).fill(null);
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day += 1) cells.push(day);
        return cells;
    }, [currentMonth]);

    const eventsForDay = (day: number | null) => {
        if (!day) return [];
        return events.filter((event) => event.date === localDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)));
    };

    const moveMonth = (offset: number) => {
        const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        const targetDay = Math.min(selectedDate.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate());
        setCurrentMonth(target);
        setSelectedDate(new Date(target.getFullYear(), target.getMonth(), targetDay));
    };

    const selectDay = (day: number) => {
        setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    };

    const persistUserEvents = (nextEvents: CalendarEvent[]) => {
        setUserEvents(nextEvents);
        localStorage.setItem(storageKey, JSON.stringify(nextEvents));
    };

    const addUserEvent = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        const newEvent: CalendarEvent = {
            id: `user-${Date.now()}`,
            date: selectedKey,
            time,
            title: trimmedTitle,
            country: '내 일정',
            importance: 1,
            category: 'user'
        };
        persistUserEvents([...userEvents, newEvent]);
        setTitle('');
    };

    const deleteUserEvent = (id: string) => {
        persistUserEvents(userEvents.filter((event) => event.id !== id));
    };

    const todayKey = localDateKey(new Date());

    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg-gradient)', padding: '1.5rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <BackButton />
                    <h1 style={{ color: 'white', margin: 0 }}>📅 경제 학습 캘린더</h1>
                </header>
                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,.18)', color: 'white', lineHeight: 1.5 }}>
                    이 캘린더의 기본 일정은 반복 학습 추천입니다. 실제 경제지표 발표일이나 투자 일정이 아닙니다.
                    {error && <><br />{error}</>}
                </div>

                <section style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button aria-label="이전 달" onClick={() => moveMonth(-1)} style={navButtonStyle}>‹</button>
                        <h2 style={{ margin: 0 }}>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</h2>
                        <button aria-label="다음 달" onClick={() => moveMonth(1)} style={navButtonStyle}>›</button>
                    </div>
                    {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>학습 일정을 불러오는 중...</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.4rem' }}>
                        {dayNames.map((name) => <div key={name} style={{ textAlign: 'center', padding: '0.4rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{name}</div>)}
                        {days.map((day, index) => {
                            const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                            const key = date ? localDateKey(date) : '';
                            const dayEvents = eventsForDay(day);
                            const selected = key === selectedKey;
                            const today = key === todayKey;
                            return (
                                <button
                                    key={`${day ?? 'blank'}-${index}`}
                                    disabled={!day}
                                    onClick={() => day && selectDay(day)}
                                    style={{
                                        minHeight: '78px', minWidth: 0, padding: '0.4rem', textAlign: 'left', borderRadius: '0.65rem',
                                        border: selected ? '2px solid var(--primary)' : today ? '2px solid #e6a700' : day ? '1px solid var(--border-color)' : '1px solid transparent',
                                        background: day ? 'var(--card-bg)' : 'transparent', color: 'var(--text-primary)', cursor: day ? 'pointer' : 'default'
                                    }}
                                >
                                    {day && <><strong>{day}</strong><div style={{ marginTop: '0.35rem', display: 'grid', gap: '0.2rem' }}>
                                        {dayEvents.slice(0, 2).map((item) => (
                                            <span key={item.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.68rem', padding: '0.18rem', borderRadius: '0.25rem', background: item.category === 'user' ? 'rgba(255,193,7,.2)' : 'rgba(79,172,254,.14)' }}>
                                                {item.category === 'user' ? '●' : '◆'} {item.time}
                                            </span>
                                        ))}
                                    </div></>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section style={{ ...cardStyle, marginTop: '1rem' }}>
                    <h2 style={{ marginTop: 0 }}>{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정</h2>
                    <form onSubmit={addUserEvent} className="calendar-event-form">
                        <label htmlFor="calendar-event-time" className="sr-only">일정 시간</label>
                        <input id="calendar-event-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required style={inputStyle} />
                        <label htmlFor="calendar-event-title" className="sr-only">일정 제목</label>
                        <input id="calendar-event-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} placeholder="내 학습 일정 추가" style={inputStyle} />
                        <button type="submit" style={addButtonStyle}>추가</button>
                    </form>
                    {selectedEvents.length === 0 ? (
                        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>이 날짜에는 일정이 없습니다. 나만의 학습 계획을 추가해 보세요.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {selectedEvents.sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                                <article key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
                                    <strong style={{ color: 'var(--primary)' }}>{event.time}</strong>
                                    <div style={{ flex: 1 }}>
                                        <strong>{event.title}</strong>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{event.category === 'user' ? '내가 추가한 일정' : '반복 학습 추천'}</div>
                                    </div>
                                    {event.category === 'user' && <button onClick={() => deleteUserEvent(event.id)} style={{ border: 0, background: 'transparent', color: '#c62828', cursor: 'pointer' }}>삭제</button>}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

const cardStyle: React.CSSProperties = {
    padding: 'clamp(0.75rem, 3vw, 1.5rem)', borderRadius: '1rem', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)'
};

const navButtonStyle: React.CSSProperties = {
    width: '38px', height: '38px', border: 0, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '1.5rem', cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
    minWidth: 0, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.6rem', background: 'var(--card-bg)', color: 'var(--text-primary)'
};

const addButtonStyle: React.CSSProperties = {
    border: 0, borderRadius: '0.6rem', padding: '0.75rem 1rem', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer'
};
