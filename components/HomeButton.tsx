'use client';

import { useRouter } from 'next/navigation';

interface HomeButtonProps {
    style?: React.CSSProperties;
}

export default function HomeButton({ style }: HomeButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/')}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'white',
                border: 'none',
                borderRadius: '2rem',
                color: '#333',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
        >
            <span style={{ fontSize: '1.25rem' }}>💰</span>
            <span>경제 링고</span>
        </button>
    );
}
