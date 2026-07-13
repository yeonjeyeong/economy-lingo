'use client';

import BackButton from '@/components/BackButton';
import { useAdmin } from '@/hooks/useAdmin';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Reaction = 'like' | 'dislike';

interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    authorId?: string;
    createdAt: unknown;
    views: number;
    comments: number;
    likes: number;
    dislikes: number;
    isDeleted: boolean;
}

interface Comment {
    id: string;
    content: string;
    author: string;
    authorId: string;
    createdAt: unknown;
}

function timeAgo(timestamp: unknown) {
    if (!timestamp) return '방금 전';
    const value = timestamp as { toDate?: () => Date };
    const date = value.toDate ? value.toDate() : new Date(timestamp as string | number | Date);
    if (Number.isNaN(date.getTime())) return '';

    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const postId = params.id;
    const { isAdmin } = useAdmin();
    const [viewer, setViewer] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [commentsError, setCommentsError] = useState('');
    const [retryKey, setRetryKey] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [myReaction, setMyReaction] = useState<Reaction | undefined>();
    const [reactionLoading, setReactionLoading] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    const fetchComments = async (id: string) => {
        setCommentsError('');
        try {
            const snapshot = await getDocs(query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'desc')));
            setComments(snapshot.docs.map((commentDocument) => {
                const data = commentDocument.data();
                return {
                    id: commentDocument.id,
                    content: String(data.content || ''),
                    author: String(data.author || '익명'),
                    authorId: String(data.authorId || ''),
                    createdAt: data.createdAt
                };
            }));
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            setCommentsError('댓글을 불러오지 못했습니다.');
        }
    };

    useEffect(() => {
        if (!isFirebaseConfigured) return;
        return onAuthStateChanged(auth, (user) => {
            setViewer(user);
            setAuthReady(true);
            if (!user) setMyReaction(undefined);
        });
    }, []);

    useEffect(() => {
        if (!postId) return;
        let active = true;

        const loadPost = async () => {
            setLoading(true);
            setLoadError('');
            if (!isFirebaseConfigured) {
                setLoadError('이 로컬 환경에는 커뮤니티 저장소가 연결되지 않았습니다.');
                setLoading(false);
                return;
            }
            try {
                const postRef = doc(db, 'posts', postId);
                const snapshot = await getDoc(postRef);
                if (!snapshot.exists()) {
                    if (active) setPost(null);
                    return;
                }

                const data = snapshot.data();
                if (data.isDeleted) {
                    if (active) {
                        setPost({
                            id: snapshot.id,
                            title: '',
                            content: '',
                            author: '',
                            authorId: '',
                            createdAt: null,
                            views: 0,
                            comments: 0,
                            likes: 0,
                            dislikes: 0,
                            isDeleted: true
                        });
                        setComments([]);
                    }
                    return;
                }

                const loadedPost: Post = {
                    id: snapshot.id,
                    title: String(data.title || '제목 없음'),
                    content: String(data.content || ''),
                    author: String(data.author || '익명'),
                    authorId: data.authorId ? String(data.authorId) : undefined,
                    createdAt: data.createdAt,
                    views: Number(data.views) || 0,
                    comments: Number(data.comments) || 0,
                    likes: Number(data.likes) || 0,
                    dislikes: Number(data.dislikes) || 0,
                    isDeleted: false
                };
                if (active) setPost(loadedPost);
                await fetchComments(postId);

                const storageKey = `economy-lingo:viewed-post:${postId}`;
                let alreadyViewed = false;
                try {
                    alreadyViewed = sessionStorage.getItem(storageKey) === '1';
                } catch {
                    // Browsers can disable storage; the page remains readable.
                }

                if (auth.currentUser && !alreadyViewed) {
                    try {
                        await updateDoc(postRef, { views: increment(1) });
                        try { sessionStorage.setItem(storageKey, '1'); } catch { /* storage unavailable */ }
                        if (active) setPost((current) => current && !current.isDeleted
                            ? { ...current, views: current.views + 1 }
                            : current);
                    } catch (error) {
                        console.error('Failed to update view count:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch post:', error);
                if (active) setLoadError('게시글을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadPost();
        return () => { active = false; };
    }, [postId, retryKey]);

    const reactionPostId = post?.isDeleted ? undefined : post?.id;

    useEffect(() => {
        if (!viewer || !reactionPostId) return;
        let active = true;
        getDoc(doc(db, 'posts', reactionPostId, 'reactions', viewer.uid))
            .then((snapshot) => {
                const type = snapshot.data()?.type;
                if (active) setMyReaction(type === 'like' || type === 'dislike' ? type : undefined);
            })
            .catch((error) => console.error('Failed to fetch reaction:', error));
        return () => { active = false; };
    }, [reactionPostId, viewer]);

    const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = newComment.trim();
        setCommentError('');

        if (!viewer) {
            setCommentError('댓글을 작성하려면 먼저 로그인해 주세요.');
            return;
        }
        if (!post || post.isDeleted) return;
        if (content.length < 1 || content.length > 1000) {
            setCommentError('댓글은 1자 이상 1,000자 이하로 입력해 주세요.');
            return;
        }

        setCommentLoading(true);
        try {
            const postRef = doc(db, 'posts', post.id);
            const commentRef = doc(collection(db, 'posts', post.id, 'comments'));
            const nextCount = await runTransaction(db, async (transaction) => {
                const postSnapshot = await transaction.get(postRef);
                if (!postSnapshot.exists() || postSnapshot.data().isDeleted) throw new Error('삭제된 게시글입니다.');
                const count = (Number(postSnapshot.data().comments) || 0) + 1;
                transaction.set(commentRef, {
                    content,
                    author: viewer.displayName || '익명',
                    authorId: viewer.uid,
                    createdAt: serverTimestamp()
                });
                transaction.update(postRef, { comments: count });
                return count;
            });
            setNewComment('');
            setPost((current) => current ? { ...current, comments: nextCount } : current);
            await fetchComments(post.id);
        } catch (error) {
            console.error('Failed to add comment:', error);
            setCommentError('댓글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!post || !viewer || !window.confirm('댓글을 삭제하시겠습니까?')) return;
        try {
            const postRef = doc(db, 'posts', post.id);
            const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
            const nextCount = await runTransaction(db, async (transaction) => {
                const [postSnapshot, commentSnapshot] = await Promise.all([
                    transaction.get(postRef),
                    transaction.get(commentRef)
                ]);
                if (!postSnapshot.exists() || !commentSnapshot.exists()) throw new Error('댓글이 존재하지 않습니다.');
                if (commentSnapshot.data().authorId !== viewer.uid && !isAdmin) throw new Error('삭제 권한이 없습니다.');
                const count = Math.max(0, (Number(postSnapshot.data().comments) || 0) - 1);
                transaction.delete(commentRef);
                transaction.update(postRef, { comments: count });
                return count;
            });
            setPost((current) => current ? { ...current, comments: nextCount } : current);
            setComments((current) => current.filter((comment) => comment.id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment:', error);
            window.alert('댓글을 삭제하지 못했습니다.');
        }
    };

    const handleReaction = async (desired: Reaction) => {
        if (!viewer) {
            window.alert('좋아요와 싫어요는 로그인 후 이용할 수 있습니다.');
            return;
        }
        if (!post || post.isDeleted || reactionLoading) return;
        setReactionLoading(true);

        try {
            const result = await runTransaction(db, async (transaction) => {
                const postRef = doc(db, 'posts', post.id);
                const reactionRef = doc(db, 'posts', post.id, 'reactions', viewer.uid);
                const [postSnapshot, reactionSnapshot] = await Promise.all([
                    transaction.get(postRef),
                    transaction.get(reactionRef)
                ]);
                if (!postSnapshot.exists() || postSnapshot.data().isDeleted) throw new Error('게시글이 존재하지 않습니다.');

                const previous = reactionSnapshot.data()?.type as Reaction | undefined;
                const next = previous === desired ? undefined : desired;
                let likes = Number(postSnapshot.data().likes) || 0;
                let dislikes = Number(postSnapshot.data().dislikes) || 0;
                if (previous === 'like') likes = Math.max(0, likes - 1);
                if (previous === 'dislike') dislikes = Math.max(0, dislikes - 1);
                if (next === 'like') likes += 1;
                if (next === 'dislike') dislikes += 1;

                if (next) transaction.set(reactionRef, { type: next, userId: viewer.uid, updatedAt: serverTimestamp() });
                else transaction.delete(reactionRef);
                transaction.update(postRef, { likes, dislikes });
                return { likes, dislikes, next };
            });
            setPost((current) => current ? { ...current, likes: result.likes, dislikes: result.dislikes } : current);
            setMyReaction(result.next);
        } catch (error) {
            console.error('Error updating reaction:', error);
            window.alert('반응을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setReactionLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!post || !window.confirm('게시글을 삭제하시겠습니까?')) return;
        setDeletingPost(true);
        try {
            await updateDoc(doc(db, 'posts', post.id), { isDeleted: true, deletedAt: serverTimestamp() });
            router.push('/community');
        } catch (error) {
            console.error('Failed to delete post:', error);
            window.alert('게시글을 삭제하지 못했습니다.');
            setDeletingPost(false);
        }
    };

    if (loading) {
        return <main className="simple-state" role="status">게시글을 불러오는 중입니다…</main>;
    }

    if (loadError) {
        return (
            <main className="simple-state" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => setRetryKey((key) => key + 1)}>다시 시도</button>
                <BackButton />
                <style jsx>{stateStyles}</style>
            </main>
        );
    }

    if (!post) {
        return (
            <main className="simple-state">
                <p>게시글을 찾을 수 없습니다.</p>
                <BackButton />
                <style jsx>{stateStyles}</style>
            </main>
        );
    }

    if (post.isDeleted) {
        return (
            <main className="simple-state">
                <p>삭제된 게시글입니다.</p>
                <span>제목, 본문과 댓글은 더 이상 표시되지 않습니다.</span>
                <BackButton />
                <style jsx>{stateStyles}</style>
            </main>
        );
    }

    const canDeletePost = viewer?.uid === post.authorId || isAdmin;

    return (
        <main className="detail-page">
            <div className="detail-shell">
                <header className="top-bar">
                    <BackButton />
                    {canDeletePost && (
                        <button type="button" className="delete-button" disabled={deletingPost} onClick={() => void handleDeletePost()}>
                            {deletingPost ? '삭제 중…' : '게시글 삭제'}
                        </button>
                    )}
                </header>

                <article className="post-card">
                    <h1>{post.title}</h1>
                    <div className="post-meta">
                        <span className="author">{post.author}</span>
                        <span>{timeAgo(post.createdAt)}</span>
                        <span>조회 {post.views}</span>
                    </div>
                    <div className="content">{post.content}</div>
                    <div className="reaction-buttons" aria-label="게시글 반응">
                        <button
                            type="button"
                            className={myReaction === 'like' ? 'selected like' : 'like'}
                            aria-pressed={myReaction === 'like'}
                            disabled={reactionLoading}
                            onClick={() => void handleReaction('like')}
                        >좋아요 {post.likes}</button>
                        <button
                            type="button"
                            className={myReaction === 'dislike' ? 'selected dislike' : 'dislike'}
                            aria-pressed={myReaction === 'dislike'}
                            disabled={reactionLoading}
                            onClick={() => void handleReaction('dislike')}
                        >싫어요 {post.dislikes}</button>
                    </div>
                    {authReady && !viewer && <p className="login-hint">반응과 댓글 작성은 로그인 후 이용할 수 있습니다.</p>}
                </article>

                <section className="comments-card" aria-labelledby="comments-heading">
                    <h2 id="comments-heading">댓글 {post.comments}</h2>
                    <form className="comment-form" onSubmit={handleAddComment} noValidate>
                        <label htmlFor="new-comment">댓글 작성</label>
                        <div className="comment-row">
                            <input
                                id="new-comment"
                                type="text"
                                maxLength={1000}
                                value={newComment}
                                onChange={(event) => setNewComment(event.target.value)}
                                placeholder={viewer ? '댓글을 입력하고 Enter를 누르세요' : '로그인 후 댓글을 작성할 수 있습니다'}
                                disabled={!authReady || !viewer || commentLoading}
                            />
                            <button type="submit" disabled={!viewer || commentLoading}>{commentLoading ? '등록 중…' : '등록'}</button>
                        </div>
                        {commentError && <p className="comment-error" role="alert">{commentError}</p>}
                    </form>

                    {commentsError ? (
                        <div className="comments-state" role="alert">
                            <span>{commentsError}</span>
                            <button type="button" onClick={() => void fetchComments(post.id)}>다시 시도</button>
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="comments-state">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</p>
                    ) : (
                        <div className="comment-list">
                            {comments.map((comment) => (
                                <article className="comment" key={comment.id}>
                                    <div className="comment-head">
                                        <div><strong>{comment.author}</strong><span>{timeAgo(comment.createdAt)}</span></div>
                                        {(viewer?.uid === comment.authorId || isAdmin) && (
                                            <button type="button" onClick={() => void handleDeleteComment(comment.id)} aria-label={`${comment.author}님의 댓글 삭제`}>삭제</button>
                                        )}
                                    </div>
                                    <p>{comment.content}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
                .detail-page { min-height: 100vh; padding: 2rem 1rem; background: var(--bg-gradient); }
                .detail-shell { max-width: 800px; margin: 0 auto; }
                .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.3rem; }
                .delete-button { min-height: 42px; padding: .6rem 1rem; border: 0; border-radius: .55rem; background: #c62828; color: white; cursor: pointer; font-weight: 700; }
                .delete-button:disabled { cursor: wait; opacity: .65; }
                .post-card, .comments-card { padding: clamp(1.25rem, 4vw, 2rem); border: 1px solid var(--border-color); border-radius: 1.25rem; background: var(--card-bg); box-shadow: var(--card-shadow); }
                .post-card { margin-bottom: 1.5rem; }
                h1 { margin: 0 0 1rem; color: var(--text-primary); font-size: clamp(1.55rem, 6vw, 2rem); line-height: 1.4; overflow-wrap: anywhere; }
                .post-meta { display: flex; flex-wrap: wrap; gap: .8rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: .85rem; }
                .author { color: var(--text-primary); font-weight: 700; }
                .content { min-height: 160px; padding: 1.5rem 0 2rem; color: var(--text-primary); font-size: 1.05rem; line-height: 1.8; overflow-wrap: anywhere; white-space: pre-wrap; }
                .reaction-buttons { display: flex; justify-content: center; gap: .75rem; }
                .reaction-buttons button { min-height: 46px; padding: .7rem 1.3rem; border: 2px solid transparent; border-radius: 999px; cursor: pointer; font-weight: 700; }
                .reaction-buttons button:disabled { cursor: wait; opacity: .65; }
                .like { background: #e8f5e9; color: #2e7d32; }
                .dislike { background: #ffebee; color: #c62828; }
                .reaction-buttons .selected { border-color: currentColor; }
                .login-hint { margin: 1rem 0 0; color: var(--text-secondary); font-size: .85rem; text-align: center; }
                .comments-card h2 { margin: 0 0 1.2rem; color: var(--text-primary); font-size: 1.2rem; }
                .comment-form { margin-bottom: 1.5rem; }
                .comment-form label { display: block; margin-bottom: .4rem; color: var(--text-primary); font-weight: 700; }
                .comment-row { display: flex; gap: .7rem; }
                .comment-row input { box-sizing: border-box; flex: 1; min-width: 0; padding: .75rem; border: 1px solid var(--border-color); border-radius: .55rem; background: var(--background); color: var(--text-primary); font: inherit; }
                .comment-row button, .comments-state button { min-height: 42px; padding: .6rem 1rem; border: 0; border-radius: .55rem; background: var(--primary); color: white; cursor: pointer; font-weight: 700; }
                .comment-row button:disabled { cursor: not-allowed; opacity: .55; }
                .comment-error { margin: .5rem 0 0; color: #c62828; font-size: .85rem; }
                .comments-state { padding: 1.5rem; color: var(--text-secondary); text-align: center; }
                .comments-state button { margin-left: .8rem; }
                .comment-list { display: grid; gap: .75rem; }
                .comment { padding: 1rem; border: 1px solid var(--border-color); border-radius: .75rem; background: var(--background); }
                .comment-head { display: flex; justify-content: space-between; gap: 1rem; }
                .comment-head div { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
                .comment-head strong { color: var(--text-primary); font-size: .9rem; }
                .comment-head span { color: var(--text-secondary); font-size: .78rem; }
                .comment-head button { border: 0; background: transparent; color: #c62828; cursor: pointer; }
                .comment p { margin: .6rem 0 0; color: var(--text-primary); line-height: 1.55; overflow-wrap: anywhere; white-space: pre-wrap; }
                button:focus-visible, input:focus-visible { outline: 3px solid #ffd54f; outline-offset: 3px; }
                @media (max-width: 520px) {
                    .detail-page { padding: 1.2rem .75rem; }
                    .reaction-buttons button { flex: 1; padding: .65rem .5rem; }
                    .comment-row { align-items: stretch; flex-direction: column; }
                    .comments-state button { display: block; margin: .75rem auto 0; }
                }
            `}</style>
        </main>
    );
}

const stateStyles = `
    .simple-state { box-sizing: border-box; min-height: 100vh; padding: 3rem 1rem; background: var(--bg-gradient); color: white; text-align: center; }
    .simple-state p { margin: 0 0 .7rem; font-size: 1.15rem; font-weight: 700; }
    .simple-state span { display: block; margin-bottom: 1.5rem; color: rgba(255,255,255,.85); }
    .simple-state button { min-height: 42px; margin: 0 .5rem 1rem; padding: .6rem 1rem; border: 0; border-radius: .55rem; background: var(--primary); color: white; cursor: pointer; font-weight: 700; }
`;
