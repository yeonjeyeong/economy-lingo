'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { useAdmin } from '@/hooks/useAdmin';
import { db } from '@/lib/firebase';
import { collection, getDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

interface User {
    id: string;
    username: string;
    email: string;
    score: number;
    quizzesTaken: number;
    createdAt: unknown;
}

interface Post {
    id: string;
    title: string;
    author: string;
    createdAt: unknown;
    views: number;
    comments: number;
    likes: number;
    isDeleted?: boolean;
}

export default function AdminPage() {
    const router = useRouter();
    const { isAdmin: isAdminUser, loading: adminLoading } = useAdmin();
    const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'stats'>('users');

    // Users
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);

    // Posts
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    // Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalQuizzes: 0,
        totalPosts: 0
    });

    useEffect(() => {
        if (!adminLoading && !isAdminUser) {
            router.push('/');
        }
    }, [isAdminUser, adminLoading, router]);

    const fetchUsers = useCallback(async () => {
        try {
            const usersCol = collection(db, 'users');
            const q = query(usersCol, orderBy('score', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedUsers: User[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedUsers.push({
                    id: doc.id,
                    username: data.username || 'Anonymous',
                    email: data.email || '',
                    score: data.score || 0,
                    quizzesTaken: data.quizzesTaken || 0,
                    createdAt: data.createdAt
                });
            });
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            const postsCol = collection(db, 'posts');
            const q = query(postsCol, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedPosts.push({
                    id: doc.id,
                    title: data.title || '',
                    author: data.author || '',
                    createdAt: data.createdAt,
                    views: data.views || 0,
                    comments: data.comments || 0,
                    likes: data.likes || 0,
                    isDeleted: data.isDeleted
                });
            });
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setPostsLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const postsSnapshot = await getDocs(collection(db, 'posts'));

            let totalQuizzes = 0;
            usersSnapshot.forEach((doc) => {
                totalQuizzes += doc.data().quizzesTaken || 0;
            });

            setStats({
                totalUsers: usersSnapshot.size,
                totalQuizzes,
                totalPosts: postsSnapshot.size
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        if (!isAdminUser) return;

        const timer = window.setTimeout(() => {
            void fetchUsers();
            void fetchPosts();
            void fetchStats();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [isAdminUser, fetchUsers, fetchPosts, fetchStats]);

    const handleUpdateScore = async (userId: string, currentScore: number) => {
        const newScore = prompt(`새 점수를 입력하세요 (현재: ${currentScore})`);
        if (newScore === null) return;

        const scoreNum = parseInt(newScore);
        if (isNaN(scoreNum)) {
            alert('올바른 숫자를 입력하세요.');
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            const publicProfileRef = doc(db, 'publicProfiles', userId);
            const publicProfile = await getDoc(publicProfileRef);
            const batch = writeBatch(db);
            batch.update(userRef, { score: scoreNum, totalScore: scoreNum });
            if (publicProfile.exists()) {
                batch.update(publicProfileRef, { totalScore: scoreNum });
            }
            await batch.commit();
            alert('점수가 업데이트되었습니다.');
            fetchUsers();
        } catch (error) {
            console.error('Failed to update score:', error);
            alert('점수 업데이트 실패');
        }
    };

    const handleDeleteUserProfile = async (userId: string, username: string) => {
        if (!confirm(
            `"${username}"님의 앱 프로필 문서를 삭제하시겠습니까?\n\n` +
            'Firebase Authentication 로그인 계정은 삭제되지 않으며, 다시 이용하면 프로필이 재생성될 수 있습니다.'
        )) return;

        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', userId));
            batch.delete(doc(db, 'publicProfiles', userId));
            await batch.commit();
            alert('앱 프로필 문서와 공개 랭킹 프로필을 삭제했습니다. 로그인 계정은 유지됩니다.');
            fetchUsers();
            fetchStats();
        } catch (error) {
            console.error('Failed to delete user profile documents:', error);
            alert('프로필 문서 삭제 실패');
        }
    };

    const handleRestorePost = async (postId: string, title: string) => {
        if (!confirm(`"${title}" 게시글을 복원하시겠습니까?`)) return;

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                isDeleted: false,
                deletedAt: null
            });
            alert('게시글이 복원되었습니다.');
            fetchPosts();
        } catch (error) {
            console.error('Failed to restore post:', error);
            alert('게시글 복원 실패');
        }
    };

    const handleDeletePost = async (postId: string, title: string) => {
        if (!confirm(`정말로 "${title}" 게시글을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            alert('게시글이 영구 삭제되었습니다.');
            fetchPosts();
            fetchStats();
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('게시글 삭제 실패');
        }
    };

    if (adminLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>로딩 중...</p>
            </div>
        );
    }

    if (!isAdminUser) {
        return null;
    }

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <BackButton style={{ marginRight: '1rem' }} />
                    <h1 style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)' }}>⚙️ 관리자 대시보드</h1>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
                    {([
                        { id: 'users', label: '👥 사용자 관리' },
                        { id: 'posts', label: '📝 게시글 관리' },
                        { id: 'stats', label: '📊 통계' }
                    ] as const).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : 'none',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'users' && (
                    <div>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>사용자 목록 ({users.length}명)</h2>
                        {usersLoading ? (
                            <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                        ) : (
                            <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)', padding: '1rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--background)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>이름</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>이메일</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>점수</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>퀴즈 수</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>액션</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{user.username}</td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.score}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>{user.quizzesTaken}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleUpdateScore(user.id, user.score)}
                                                        style={{
                                                            padding: '0.3rem 0.6rem',
                                                            marginRight: '0.5rem',
                                                            background: '#4CAF50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        점수 수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUserProfile(user.id, user.username)}
                                                        style={{
                                                            padding: '0.3rem 0.6rem',
                                                            background: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        프로필 문서 삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>게시글 목록 ({posts.length}개)</h2>
                        {postsLoading ? (
                            <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                        ) : (
                            <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)', padding: '1rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--background)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>상태</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>제목</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>작성자</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>조회수</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>액션</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map((post) => (
                                            <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)', background: post.isDeleted ? 'rgba(255, 0, 0, 0.1)' : 'transparent' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {post.isDeleted ? <span style={{ color: '#f44336', fontWeight: 'bold' }}>삭제됨</span> : <span style={{ color: '#4CAF50' }}>게시중</span>}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{post.title}</td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{post.author}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>{post.views}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    {post.isDeleted ? (
                                                        <button
                                                            onClick={() => handleRestorePost(post.id, post.title)}
                                                            style={{
                                                                padding: '0.3rem 0.6rem',
                                                                marginRight: '0.5rem',
                                                                background: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            복원
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() => handleDeletePost(post.id, post.title)}
                                                        style={{
                                                            padding: '0.3rem 0.6rem',
                                                            background: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        영구 삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>통계 대시보드</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalUsers}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>총 사용자</div>
                            </div>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{stats.totalQuizzes}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>총 퀴즈 참여</div>
                            </div>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.totalPosts}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>총 게시글</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>상위 10명 사용자</h3>
                            <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)', padding: '1rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--background)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>순위</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>이름</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>점수</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>퀴즈 수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.slice(0, 10).map((user, index) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{user.username}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.score}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>{user.quizzesTaken}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
