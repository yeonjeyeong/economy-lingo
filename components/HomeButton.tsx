import Link from 'next/link';

interface HomeButtonProps {
    style?: React.CSSProperties;
}

export default function HomeButton({ style }: HomeButtonProps) {
    return (
        <Link
            href="/"
            aria-label="경제 링고 홈으로 이동"
            className="home-button"
            style={style}
        >
            <span aria-hidden="true">🏠</span>
            <span>경제 링고</span>
        </Link>
    );
}
