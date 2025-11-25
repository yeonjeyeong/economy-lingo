'use client';

import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                border: 'none',
                background: theme === 'light' ? 'white' : '#333',
                color: theme === 'light' ? '#333' : 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                zIndex: 9999,
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            aria-label="Toggle Dark Mode"
        >
            {theme === 'light' ? '☀️' : '🌙'}
        </button>
    );
}
