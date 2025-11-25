'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: any;
    views: number;
    comments: number;
    likes: number;
    dislikes: number;
    isDeleted?: boolean;
}

export default function CommunityPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showWriteForm, setShowWriteForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedPosts: Post[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter out deleted posts
                if (!data.isDeleted) {
                    fetchedPosts.push({
                        id: doc.id,
                        title: data.title,
                        content: data.content,
                        author: data.author,
                        createdAt: data.createdAt,
                        views: data.views || 0,
                        comments: data.comments || 0,
                        likes: data.likes || 0,
                        dislikes: data.dislikes || 0,
                        isDeleted: data.isDeleted
                    });
                }
            });
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWritePost = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            await addDoc(collection(db, 'posts'), {
                title: newTitle,
                content: newContent,
                author: user.displayName || 'Anonymous',
                authorId: user.uid,
                createdAt: serverTimestamp(),
                views: 0,
                comments: 0,
                likes: 0,
                dislikes: 0
            });

            setNewTitle('');
            setNewContent('');
            setShowWriteForm(false);
            fetchPosts();
        } catch (error) {
            console.error('Error adding post:', error);
            alert('글 작성에 실패했습니다.');
        }
    };

    const handleReaction = async (postId: string, type: 'like' | 'dislike', e: React.MouseEvent) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const postRef = doc(db, 'posts', postId);
        try {
            if (type === 'like') {
                await updateDoc(postRef, { likes: increment(1) });
                setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
            } else {
                await updateDoc(postRef, { dislikes: increment(1) });
                setPosts(posts.map(p => p.id === postId ? { ...p, dislikes: p.dislikes + 1 } : p));
            }
        } catch (error) {
            console.error('Error updating reaction:', error);
        }
    };

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return '방금 전';
        if (diffHours < 24) return `${diffHours}시간 전`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}일 전`;
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BackButton style={{ marginRight: '1rem' }} />
                        <h1 style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold', textShadow: 'var(--header-text-shadow)' }}>커뮤니티</h1>
                    </div>
                    <button
                        onClick={() => setShowWriteForm(!showWriteForm)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        {showWriteForm ? '❌ 취소' : '✏️ 글쓰기'}
                    </button>
                </div>

                {/* Write Form */}
                {showWriteForm && (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                        <input
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--background)', color: 'var(--text-primary)' }}
                        />
                        <textarea
                            placeholder="내용을 입력하세요"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', minHeight: '150px', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--background)', color: 'var(--text-primary)' }}
                        />
                        <button
                            onClick={handleWritePost}
                            style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            등록하기
                        </button>
                    </div>
                )}

                {/* Search */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="게시글 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius)',
                            fontSize: '1rem',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
                        <p>게시글을 불러오는 중...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--card-shadow)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>게시글이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                className="card"
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: 'var(--card-bg)',
                                    borderRadius: '1rem',
                                    boxShadow: 'var(--card-shadow)',
                                    border: '1px solid var(--border-color)'
                                }}
                                onClick={() => router.push(`/community/${post.id}`)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                                }}
                            >
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    marginBottom: '0.75rem',
                                    color: 'var(--text-primary)'
                                }}>
                                    {post.title}
                                </h3>

                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.5'
                                }}>
                                    {post.content}
                                </p>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {post.author}
                                        </span>
                                        <span>•</span>
                                        <span>{getTimeAgo(post.createdAt)}</span>
                                        <span>•</span>
                                        <span>👁️ {post.views}</span>
                                        <span>•</span>
                                        <span>💬 {post.comments}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => handleReaction(post.id, 'like', e)}
                                            style={{
                                                background: 'rgba(46, 125, 50, 0.1)',
                                                border: 'none',
                                                borderRadius: '9999px',
                                                padding: '0.25rem 0.75rem',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: '#2e7d32'
                                            }}
                                        >
                                            👍 {post.likes}
                                        </button>
                                        <button
                                            onClick={(e) => handleReaction(post.id, 'dislike', e)}
                                            style={{
                                                background: 'rgba(198, 40, 40, 0.1)',
                                                border: 'none',
                                                borderRadius: '9999px',
                                                padding: '0.25rem 0.75rem',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: '#c62828'
                                            }}
                                        >
                                            👎 {post.dislikes}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius)',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'white'
                }}>
                    💡 경제에 대한 질문이나 의견을 자유롭게 나눠보세요!
                </div>
            </div>
        </div>
    );
}
