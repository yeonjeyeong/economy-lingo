'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ color = 'currentColor', style }: { color?: string, style?: React.CSSProperties }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            aria-label="이전 페이지로 돌아가기"
            className="back-button"
            style={{ color, ...style }}
        >
            <span aria-hidden="true">←</span>
        </button>
    );
}
