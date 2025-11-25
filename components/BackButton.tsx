'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ color = 'black', style }: { color?: string, style?: React.CSSProperties }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: color,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                zIndex: 10,
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }}
        >
            ←
        </button>
    );
}
