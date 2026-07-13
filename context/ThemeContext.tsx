'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        let nextTheme: Theme = 'light';
        try {
            const savedTheme = localStorage.getItem('theme') as Theme | null;
            if (savedTheme === 'light' || savedTheme === 'dark') {
                nextTheme = savedTheme;
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                nextTheme = 'dark';
            }
        } catch {
            // Storage can be unavailable in privacy-restricted browsers.
        }
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        queueMicrotask(() => setTheme(nextTheme));
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch {
            // The visual theme still changes when storage is unavailable.
        }
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
