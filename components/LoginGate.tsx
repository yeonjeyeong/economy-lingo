'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    type User,
} from 'firebase/auth';
import {
    doc,
    onSnapshot,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import ThemeToggle from './ThemeToggle';

type UserProfile = {
    username?: string;
    score?: number;
};

const navigation = [
    { href: '/', label: '홈' },
    { href: '/quiz', label: '퀴즈' },
    { href: '/news', label: '뉴스' },
    { href: '/calendar', label: '캘린더' },
    { href: '/community', label: '커뮤니티' },
    { href: '/wrong-answers', label: '오답 노트' },
    { href: '/ranking', label: '랭킹' },
];

function gradeFor(score = 0) {
    if (score >= 10000) return { icon: '💎', name: '다이아몬드' };
    if (score >= 3000) return { icon: '🥇', name: '골드' };
    if (score >= 1000) return { icon: '🥈', name: '실버' };
    return { icon: '🌱', name: '경제 새싹' };
}

export default function LoginGate({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
    const [authBusy, setAuthBusy] = useState(false);
    const [authError, setAuthError] = useState('');
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const pathname = usePathname();
    const { isAdmin } = useAdmin();

    useEffect(() => {
        if (!isFirebaseConfigured) {
            return;
        }

        let unsubscribeProfile: (() => void) | undefined;
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubscribeProfile?.();
            unsubscribeProfile = undefined;
            setUser(currentUser);
            setAuthError('');

            if (currentUser) {
                try {
                    unsubscribeProfile = onSnapshot(
                        doc(db, 'users', currentUser.uid),
                        (snapshot) => setUserData(snapshot.exists() ? snapshot.data() : null),
                        () => setUserData(null),
                    );
                } catch {
                    setAuthError('프로필 동기화에 실패했습니다. 학습 콘텐츠는 계속 이용할 수 있어요.');
                }
            } else {
                setUserData(null);
            }
            setAuthLoading(false);
        }, () => {
            setAuthLoading(false);
            setAuthError('로그인 상태를 확인하지 못했습니다. 게스트로 둘러볼 수 있어요.');
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProfile?.();
        };
    }, []);

    const handleLogin = async () => {
        if (!isFirebaseConfigured) {
            setAuthError('이 로컬 환경에는 Firebase 로그인 설정이 없습니다. 게스트 기능은 정상 이용할 수 있어요.');
            return;
        }

        setAuthBusy(true);
        setAuthError('');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            const code = typeof error === 'object' && error && 'code' in error
                ? String(error.code)
                : '';
            if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
                await signInWithRedirect(auth, provider);
                return;
            }
            if (code !== 'auth/popup-closed-by-user') {
                setAuthError('Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setAuthBusy(false);
        }
    };

    const handleLogout = async () => {
        setAuthBusy(true);
        setAuthError('');
        try {
            await signOut(auth);
        } catch {
            setAuthError('로그아웃에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setAuthBusy(false);
        }
    };

    const grade = gradeFor(userData?.score);
    const displayName = userData?.username || user?.displayName || '게스트';

    return (
        <>
            <a className="skip-link" href="#main-content">본문으로 바로가기</a>
            <header className="app-header">
                <div className="app-header__inner">
                    <Link className="app-brand" href="/" aria-label="경제 링고 홈">
                        <span aria-hidden="true">◒</span>
                        <span>경제 링고</span>
                    </Link>

                    <nav className="app-nav" aria-label="주요 메뉴">
                        {navigation.map((item) => {
                            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`app-nav__link${active ? ' is-active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="account-actions">
                        <ThemeToggle />
                        {authLoading ? (
                            <span className="account-status" aria-live="polite">로그인 확인 중…</span>
                        ) : user ? (
                            <>
                                <span className="account-profile" title={`${grade.name} · ${displayName}`}>
                                    <span aria-hidden="true">{grade.icon}</span>
                                    <span className="account-profile__name">{displayName}</span>
                                </span>
                                {isAdmin && <Link className="header-button" href="/admin">관리</Link>}
                                <button className="header-button" onClick={handleLogout} disabled={authBusy}>
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <button className="header-button header-button--primary" onClick={handleLogin} disabled={authBusy}>
                                {authBusy ? '연결 중…' : 'Google 로그인'}
                            </button>
                        )}
                    </div>
                </div>
                {authError && <p className="auth-notice" role="status">{authError}</p>}
            </header>
            <main id="main-content" className="app-main" tabIndex={-1}>
                {children}
            </main>
        </>
    );
}
