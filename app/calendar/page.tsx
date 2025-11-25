'use client';

import BackButton from '@/components/BackButton';
import { useState } from 'react';

interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    time: string;
    title: string;
    country: string;
    importance: number;
}

const mockEvents: CalendarEvent[] = [
    // 2025 November
    { id: 'nov-1', date: '2025-11-03', time: '23:00', title: '미국 ISM 제조업 지수', country: 'USA', importance: 3 },
    { id: 'nov-2', date: '2025-11-04', time: '23:00', title: '미국 JOLTs 구인이직 보고서', country: 'USA', importance: 2 },
    { id: 'nov-3', date: '2025-11-05', time: '21:15', title: '미국 ADP 비농업 고용변화', country: 'USA', importance: 2 },
    { id: 'nov-4', date: '2025-11-05', time: '23:00', title: '미국 ISM 서비스업 지수', country: 'USA', importance: 3 },
    { id: 'nov-5', date: '2025-11-07', time: '21:30', title: '미국 비농업 고용지수', country: 'USA', importance: 3 },
    { id: 'nov-6', date: '2025-11-07', time: '21:30', title: '미국 실업률', country: 'USA', importance: 3 },
    { id: 'nov-7', date: '2025-11-13', time: '21:30', title: '미국 생산자물가지수(PPI)', country: 'USA', importance: 2 },
    { id: 'nov-8', date: '2025-11-24', time: '21:30', title: '미국 소매판매', country: 'USA', importance: 3 },
    { id: 'nov-9', date: '2025-11-24', time: '23:00', title: '미국 소비자신뢰지수', country: 'USA', importance: 2 },
    { id: 'nov-10', date: '2025-11-27', time: '00:00', title: '추수감사절 휴장', country: 'USA', importance: 1 },

    // 2025 December
    { id: 'dec-1', date: '2025-12-01', time: '23:00', title: '미국 ISM 제조업 지수', country: 'USA', importance: 3 },
    { id: 'dec-2', date: '2025-12-03', time: '23:00', title: '미국 ISM 서비스업 지수', country: 'USA', importance: 3 },
    { id: 'dec-3', date: '2025-12-05', time: '21:30', title: '미국 비농업 고용지수', country: 'USA', importance: 3 },
    { id: 'dec-4', date: '2025-12-05', time: '21:30', title: '미국 실업률', country: 'USA', importance: 3 },
    { id: 'dec-5', date: '2025-12-10', time: '21:30', title: '미국 소비자물가지수(CPI)', country: 'USA', importance: 3 },
    { id: 'dec-6', date: '2025-12-11', time: '03:00', title: 'FOMC 금리결정', country: 'USA', importance: 3 },
    { id: 'dec-7', date: '2025-12-11', time: '03:30', title: '파월 의장 기자회견', country: 'USA', importance: 3 },
    { id: 'dec-8', date: '2025-12-17', time: '21:30', title: '미국 소매판매', country: 'USA', importance: 3 },
    { id: 'dec-9', date: '2025-12-25', time: '00:00', title: '크리스마스 휴장', country: 'Global', importance: 1 },

    // 2026 January
    { id: 'jan-1', date: '2026-01-01', time: '00:00', title: '신정 휴장', country: 'Global', importance: 1 },
    { id: 'jan-2', date: '2026-01-09', time: '21:30', title: '미국 비농업 고용지수', country: 'USA', importance: 3 },
    { id: 'jan-3', date: '2026-01-09', time: '21:30', title: '미국 실업률', country: 'USA', importance: 3 },
    { id: 'jan-4', date: '2026-01-13', time: '21:30', title: '미국 소비자물가지수(CPI)', country: 'USA', importance: 3 },
    { id: 'jan-5', date: '2026-01-14', time: '21:30', title: '미국 생산자물가지수(PPI)', country: 'USA', importance: 2 },
    { id: 'jan-6', date: '2026-01-15', time: '21:30', title: '미국 소매판매', country: 'USA', importance: 3 },
    { id: 'jan-7', date: '2026-01-29', time: '03:00', title: 'FOMC 금리결정', country: 'USA', importance: 3 },
    { id: 'jan-8', date: '2026-01-29', time: '03:30', title: '파월 의장 기자회견', country: 'USA', importance: 3 },

    // 2026 February
    { id: 'feb-1', date: '2026-02-05', time: '23:00', title: '미국 ISM 서비스업 지수', country: 'USA', importance: 3 },
    { id: 'feb-2', date: '2026-02-06', time: '21:30', title: '미국 비농업 고용지수', country: 'USA', importance: 3 },
    { id: 'feb-3', date: '2026-02-06', time: '21:30', title: '미국 실업률', country: 'USA', importance: 3 },
    { id: 'feb-4', date: '2026-02-11', time: '21:30', title: '미국 소비자물가지수(CPI)', country: 'USA', importance: 3 },
    { id: 'feb-5', date: '2026-02-12', time: '21:30', title: '미국 생산자물가지수(PPI)', country: 'USA', importance: 2 },
    { id: 'feb-6', date: '2026-02-16', time: '00:00', title: '대통령의 날 휴장', country: 'USA', importance: 1 },
];

export default function CalendarPage() {
    const [events] = useState<CalendarEvent[]>(mockEvents);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const getStars = (importance: number) => '⭐'.repeat(importance);

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        const days: (number | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    };

    const isSelectedDate = (day: number | null) => {
        if (!day) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isToday = (day: number | null) => {
        if (!day) return false;
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const getEventsForDay = (day: number | null) => {
        if (!day) return [];
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const getSelectedDateEvents = () => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Adjust for timezone offset to ensure correct date string generation
        const offset = newDate.getTimezoneOffset() * 60000;
        const localDate = new Date(newDate.getTime() - offset);
        setSelectedDate(localDate);
    };

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', padding: '2rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', transition: 'background 0.3s ease' }}>
            <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <BackButton />
            </div>
            <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white', textShadow: 'var(--header-text-shadow)' }}>📅 경제 캘린더</h1>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
                {/* Calendar Grid */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--card-shadow)', width: '100%', border: '1px solid var(--border-color)' }}>
                    {/* Month Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => {
                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                                setSelectedDate(new Date());
                            }}
                            style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            ‹
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
                        </h2>
                        <button
                            onClick={() => {
                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                                setSelectedDate(new Date());
                            }}
                            style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            ›
                        </button>
                    </div>
                    {/* Day Names */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {dayNames.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                                {d}
                            </div>
                        ))}
                        {getDaysInMonth().map((day, idx) => {
                            const selected = isSelectedDate(day);
                            const today = isToday(day);
                            const dayEvents = getEventsForDay(day);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => day && handleDateClick(day)}
                                    style={{
                                        minHeight: '100px',
                                        minWidth: 0, // Critical for equal width columns in grid
                                        width: '100%',
                                        padding: '0.5rem',
                                        background: selected ? 'rgba(24, 144, 255, 0.1)' : today ? 'var(--card-bg)' : day ? 'var(--card-bg)' : 'transparent',
                                        border: selected ? '2px solid #1890ff' : today ? '2px solid #FFD700' : day ? '1px solid var(--border-color)' : 'none',
                                        borderRadius: '0.75rem',
                                        cursor: day ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                        boxShadow: selected ? '0 0 10px rgba(24, 144, 255, 0.3)' : today ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
                                        pointerEvents: day ? 'auto' : 'none', // Disable clicks on empty cells
                                    }}
                                    onMouseEnter={e => {
                                        if (day) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (day) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = selected ? '0 0 10px rgba(24, 144, 255, 0.3)' : today ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none';
                                        }
                                    }}
                                >
                                    {day && (
                                        <>
                                            <div style={{
                                                fontWeight: today || selected ? 'bold' : 'normal',
                                                color: selected ? '#1890ff' : today ? '#FFD700' : 'var(--text-primary)',
                                                marginBottom: '0.5rem',
                                                fontSize: '1rem'
                                            }}>
                                                {day}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div key={event.id} style={{
                                                        fontSize: '0.7rem',
                                                        background: 'var(--warning)', // Use variable
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        color: '#333', // Keep dark text for contrast on light warning bg
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis', // Ensure text cuts off
                                                        maxWidth: '100%'
                                                    }}>
                                                        <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>{getStars(event.importance)}</span>
                                                        <span style={{ fontWeight: 'bold', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.time}</span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>+{dayEvents.length - 3} more</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Events List */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '1rem', padding: '1.5rem', boxShadow: 'var(--card-shadow)', width: '100%', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
                    </h2>
                    {getSelectedDateEvents().length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
                            <p>해당 날짜에는 예정된 경제 일정이 없습니다.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {getSelectedDateEvents().map((event, i) => (
                                <div
                                    key={event.id}
                                    style={{ padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', transition: 'all 0.3s', animation: `slideIn 0.4s ease-out ${i * 0.1}s backwards` }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{getStars(event.importance)}</span>
                                        <span style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold' }}>{event.time}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{event.title}</h3>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>📍 {event.country}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
