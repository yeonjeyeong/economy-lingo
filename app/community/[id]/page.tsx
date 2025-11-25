'use client';

import BackButton from '@/components/BackButton';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, query, orderBy, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

import { useAdmin } from '@/hooks/useAdmin';

interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    authorId?: string;
    createdAt: any;
    views: number;
    comments: number;
    likes: number;
    dislikes: number;
    isDeleted?: boolean;
}

export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAdmin();

    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPost(id as string);
            fetchComments(id as string);
        }
    }, [id]);

    const fetchPost = async (postId: string) => {
        setLoading(true);
        try {
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const data = postSnap.data();
                setPost({
                    id: postSnap.id,
                    title: data.title,
                    content: data.content,
                    author: data.author,
                    authorId: data.authorId,
                    createdAt: data.createdAt,
                    views: data.views || 0,
                    comments: data.comments || 0,
                    likes: data.likes || 0,
                    dislikes: data.dislikes || 0,
                    isDeleted: data.isDeleted
                });

                await updateDoc(postRef, {
                    views: increment(1)
                });
            } else {
                console.error('Post not found');
            }
        } catch (error) {
            console.error('Failed to fetch post:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId: string) => {
        try {
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedComments: any[] = [];
            snapshot.forEach((doc) => {
                fetchedComments.push({ id: doc.id, ...doc.data() });
            });
            setComments(fetchedComments);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const user = auth.currentUser;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        setCommentLoading(true);
        try {
            const commentsRef = collection(db, 'posts', post!.id, 'comments');
            await addDoc(commentsRef, {
                content: newComment,
                author: user.displayName || 'Anonymous',
                authorId: user.uid,
                createdAt: serverTimestamp()
            });

            // Update comment count on post
            const postRef = doc(db, 'posts', post!.id);
            await updateDoc(postRef, {
                comments: increment(1)
            });

            setNewComment('');
            fetchComments(post!.id);
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('댓글 작성 실패');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'posts', post!.id, 'comments', commentId));
            await updateDoc(doc(db, 'posts', post!.id), {
                comments: increment(-1)
            });
            fetchComments(post!.id);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleReaction = async (type: 'like' | 'dislike') => {
        if (!post) return;

        const user = auth.currentUser;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const postRef = doc(db, 'posts', post.id);
        try {
            if (type === 'like') {
                await updateDoc(postRef, { likes: increment(1) });
                setPost({ ...post, likes: post.likes + 1 });
            } else {
                await updateDoc(postRef, { dislikes: increment(1) });
                setPost({ ...post, dislikes: post.dislikes + 1 });
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

    const handleDeletePost = async () => {
        if (!confirm('게시글을 삭제하시겠습니까? (관리자에 의해 복구될 수 있습니다)')) return;
        try {
            const postRef = doc(db, 'posts', post!.id);
            await updateDoc(postRef, {
                isDeleted: true,
                deletedAt: serverTimestamp()
            });
            alert('게시글이 삭제되었습니다.');
            router.push('/community');
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('게시글 삭제 실패');
        }
    };



    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <p>로딩 중...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <p>게시글을 찾을 수 없습니다.</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <BackButton />
                </div>
            </div>
        );
    }

    if (post.isDeleted && !isAdmin) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <p>삭제된 게시글입니다.</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <BackButton />
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh', transition: 'background 0.3s ease', padding: '2rem 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <BackButton />
                    {(auth.currentUser?.uid === post.authorId || isAdmin) && (
                        <button
                            onClick={handleDeletePost}
                            style={{
                                background: '#ff6b6b',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            삭제
                        </button>
                    )}
                </div>

                <div className="card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '1.5rem', boxShadow: 'var(--card-shadow)', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                    {post.isDeleted && (
                        <div style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            ⚠️ 삭제된 게시글입니다 (관리자에게만 보임)
                        </div>
                    )}
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        {post.title}
                    </h1>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '2rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                    }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{post.author}</span>
                        <span>•</span>
                        <span>{getTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        <span>👁️ {post.views}</span>
                    </div>

                    <div style={{
                        fontSize: '1.1rem',
                        lineHeight: '1.8',
                        color: 'var(--text-primary)',
                        minHeight: '200px',
                        marginBottom: '3rem',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {post.content}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => handleReaction('like')}
                            style={{
                                background: '#e8f5e9',
                                border: '2px solid #e8f5e9',
                                borderRadius: '9999px',
                                padding: '0.75rem 2rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#2e7d32',
                                fontWeight: 'bold',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            👍 좋아요 {post.likes}
                        </button>
                        <button
                            onClick={() => handleReaction('dislike')}
                            style={{
                                background: '#ffebee',
                                border: '2px solid #ffebee',
                                borderRadius: '9999px',
                                padding: '0.75rem 2rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#c62828',
                                fontWeight: 'bold',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            👎 싫어요 {post.dislikes}
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '1.5rem', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>💬 댓글 {comments.length}개</h3>

                    {/* Comment Form */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="댓글을 입력하세요..."
                            style={{
                                flex: 1,
                                padding: '0.8rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--background)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={commentLoading}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                opacity: commentLoading ? 0.7 : 1
                            }}
                        >
                            등록
                        </button>
                    </div>

                    {/* Comment List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {comments.map((comment) => (
                            <div key={comment.id} style={{ padding: '1rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{comment.author}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{getTimeAgo(comment.createdAt)}</span>
                                    </div>
                                    {auth.currentUser?.uid === comment.authorId && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ff6b6b',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.5' }}>{comment.content}</p>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>첫 번째 댓글을 남겨보세요!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
