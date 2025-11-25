'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import HomeButton from './HomeButton';
import { isAdmin } from '@/lib/adminConfig';

export default function LoginGate({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();
    const userIsAdmin = user?.email ? isAdmin(user.email) : false;

    useEffect(() => {
        let unsubscribeUser: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Real-time listener for user data
                const userRef = doc(db, 'users', currentUser.uid);
                unsubscribeUser = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data());
                    }
                });
            } else {
                setUserData(null);
                if (unsubscribeUser) {
                    unsubscribeUser();
                    unsubscribeUser = null;
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUser) {
                unsubscribeUser();
            }
        };
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const getGrade = (score: number) => {
        if (score >= 10000) return { icon: '💎', name: 'Diamond' };
        if (score >= 3000) return { icon: '🥇', name: 'Gold' };
        if (score >= 1000) return { icon: '🥈', name: 'Silver' };
        return { icon: '🥉', name: 'Bronze' };
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.5rem'
            }}>
                로딩 중...
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem'
            }}>
                <div style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '2rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%',
                    animation: 'fadeInUp 0.5s ease-out'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💰</div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: '1rem'
                    }}>
                        경제 링고
                    </h1>
                    <p style={{
                        color: '#666',
                        marginBottom: '2.5rem',
                        lineHeight: '1.6'
                    }}>
                        경제를 쉽고 재미있게 배워보세요!<br />
                        시작하려면 로그인이 필요합니다.
                    </p>

                    <button
                        onClick={handleLogin}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'white',
                            border: '2px solid #e0e0e0',
                            borderRadius: '9999px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#333',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                        }}
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            style={{ width: '20px', height: '20px' }}
                        />
                        구글로 계속하기
                    </button>
                </div>
                <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
            </div>
        );
    }

    const grade = userData ? getGrade(userData.score || 0) : { icon: '🥉', name: 'Bronze' };

    // Only show header if not on main page
    const isMainPage = pathname === '/';

    return (
        <>
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 1000
            }}>
                {!isMainPage && <HomeButton />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: isMainPage ? 'auto' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
                        <span style={{ fontSize: '1.2rem' }} title={grade.name}>{grade.icon}</span>
                        <img
                            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                            alt="Profile"
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #eee' }}
                        />
                        <span style={{ fontWeight: 'bold' }}>{user.displayName}</span>
                    </div>
                    {userIsAdmin && (
                        <>
                            <div style={{ width: '1px', height: '20px', background: '#e0e0e0' }}></div>
                            <button
                                onClick={() => router.push('/admin')}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    background: '#9c27b0',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#7b1fa2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#9c27b0'}
                            >
                                ⚙️ 관리
                            </button>
                        </>
                    )}
                    <div style={{ width: '1px', height: '20px', background: '#e0e0e0' }}></div>
                    <button
                        onClick={() => auth.signOut()}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: '#f5f5f5',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    >
                        로그아웃
                    </button>
                </div>
            </header>
            <div style={{ paddingTop: '60px' }}>
                {children}
            </div>
        </>
    );
}
