'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = theme === 'light' ? '다크' : '라이트';

    return (
        <button
            onClick={toggleTheme}
            className="header-button icon-button"
            aria-label={`${nextTheme} 모드로 전환`}
            title={`${nextTheme} 모드로 전환`}
        >
            <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
        </button>
    );
}
