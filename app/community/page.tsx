'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

type Reaction = 'like' | 'dislike';

interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: unknown;
    views: number;
    comments: number;
    likes: number;
    dislikes: number;
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

export default function CommunityPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showWriteForm, setShowWriteForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewer, setViewer] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
    const [reactions, setReactions] = useState<Record<string, Reaction | undefined>>({});
    const [reactionBusy, setReactionBusy] = useState<Record<string, boolean>>({});

    const fetchPosts = async () => {
        setLoading(true);
        setLoadError('');
        if (!isFirebaseConfigured) {
            setPosts([]);
            setLoadError('이 로컬 환경에는 커뮤니티 저장소가 연결되지 않았습니다. Firebase 설정 후 게시글을 불러올 수 있어요.');
            setLoading(false);
            return;
        }
        try {
            const snapshot = await getDocs(query(
                collection(db, 'posts'),
                where('isDeleted', '==', false),
                orderBy('createdAt', 'desc'),
                limit(50),
            ));
            const fetched = snapshot.docs.flatMap((postDocument) => {
                const data = postDocument.data();
                if (data.isDeleted) return [];
                return [{
                    id: postDocument.id,
                    title: String(data.title || '제목 없음'),
                    content: String(data.content || ''),
                    author: String(data.author || '익명'),
                    createdAt: data.createdAt,
                    views: Number(data.views) || 0,
                    comments: Number(data.comments) || 0,
                    likes: Number(data.likes) || 0,
                    dislikes: Number(data.dislikes) || 0
                } satisfies Post];
            });
            setPosts(fetched);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            setLoadError('게시글을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => void fetchPosts(), 0);
        if (!isFirebaseConfigured) {
            return () => window.clearTimeout(timeout);
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setViewer(user);
            setAuthReady(true);
            if (!user) setReactions({});
        });
        return () => {
            window.clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!viewer || posts.length === 0) return;
        let active = true;

        Promise.all(posts.map(async (post) => {
            const reactionSnapshot = await getDoc(doc(db, 'posts', post.id, 'reactions', viewer.uid));
            const type = reactionSnapshot.data()?.type;
            return [post.id, type === 'like' || type === 'dislike' ? type : undefined] as const;
        })).then((entries) => {
            if (active) setReactions(Object.fromEntries(entries));
        }).catch((error) => console.error('Failed to fetch reactions:', error));

        return () => { active = false; };
    }, [posts, viewer]);

    const handleWritePost = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const title = newTitle.trim();
        const content = newContent.trim();
        setFormError('');

        if (!viewer) {
            setFormError('게시글을 작성하려면 먼저 로그인해 주세요.');
            return;
        }
        if (title.length < 2 || title.length > 100) {
            setFormError('제목은 2자 이상 100자 이하로 입력해 주세요.');
            return;
        }
        if (content.length < 10 || content.length > 5000) {
            setFormError('내용은 10자 이상 5,000자 이하로 입력해 주세요.');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'posts'), {
                title,
                content,
                author: viewer.displayName || '익명',
                authorId: viewer.uid,
                createdAt: serverTimestamp(),
                views: 0,
                comments: 0,
                likes: 0,
                dislikes: 0,
                isDeleted: false
            });
            setNewTitle('');
            setNewContent('');
            setShowWriteForm(false);
            await fetchPosts();
        } catch (error) {
            console.error('Error adding post:', error);
            setFormError('게시글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReaction = async (postId: string, desired: Reaction) => {
        if (!viewer) {
            window.alert('좋아요와 싫어요는 로그인 후 이용할 수 있습니다.');
            return;
        }
        if (reactionBusy[postId]) return;
        setReactionBusy((current) => ({ ...current, [postId]: true }));

        try {
            const result = await runTransaction(db, async (transaction) => {
                const postRef = doc(db, 'posts', postId);
                const reactionRef = doc(db, 'posts', postId, 'reactions', viewer.uid);
                const [postSnapshot, reactionSnapshot] = await Promise.all([
                    transaction.get(postRef),
                    transaction.get(reactionRef)
                ]);

                if (!postSnapshot.exists() || postSnapshot.data().isDeleted) {
                    throw new Error('게시글이 존재하지 않습니다.');
                }

                const previous = reactionSnapshot.data()?.type as Reaction | undefined;
                const next = previous === desired ? undefined : desired;
                let likes = Number(postSnapshot.data().likes) || 0;
                let dislikes = Number(postSnapshot.data().dislikes) || 0;

                if (previous === 'like') likes = Math.max(0, likes - 1);
                if (previous === 'dislike') dislikes = Math.max(0, dislikes - 1);
                if (next === 'like') likes += 1;
                if (next === 'dislike') dislikes += 1;

                if (next) {
                    transaction.set(reactionRef, { type: next, userId: viewer.uid, updatedAt: serverTimestamp() });
                } else {
                    transaction.delete(reactionRef);
                }
                transaction.update(postRef, { likes, dislikes });
                return { likes, dislikes, next };
            });

            setPosts((current) => current.map((post) => post.id === postId
                ? { ...post, likes: result.likes, dislikes: result.dislikes }
                : post));
            setReactions((current) => ({ ...current, [postId]: result.next }));
        } catch (error) {
            console.error('Error updating reaction:', error);
            window.alert('반응을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setReactionBusy((current) => ({ ...current, [postId]: false }));
        }
    };

    const filteredPosts = useMemo(() => {
        const keyword = searchQuery.trim().toLocaleLowerCase('ko');
        if (!keyword) return posts;
        return posts.filter((post) =>
            post.title.toLocaleLowerCase('ko').includes(keyword) ||
            post.content.toLocaleLowerCase('ko').includes(keyword)
        );
    }, [posts, searchQuery]);

    const toggleWriteForm = () => {
        setFormError('');
        setShowWriteForm((visible) => !visible);
    };

    return (
        <main className="community-page">
            <div className="community-shell">
                <header className="community-header">
                    <div className="heading">
                        <BackButton />
                        <div>
                            <h1>커뮤니티</h1>
                            <p>경제에 관한 질문과 생각을 함께 나눠 보세요.</p>
                        </div>
                    </div>
                    <button type="button" className="primary" onClick={toggleWriteForm}>
                        {showWriteForm ? '작성 취소' : '글쓰기'}
                    </button>
                </header>

                {authReady && !viewer && (
                    <div className="guest-notice" role="status">게시글은 누구나 읽을 수 있으며, 작성·댓글·반응은 로그인 후 이용할 수 있습니다.</div>
                )}

                {showWriteForm && (
                    <form className="write-form" onSubmit={handleWritePost} noValidate>
                        <h2>새 게시글</h2>
                        <label htmlFor="post-title">제목</label>
                        <input
                            id="post-title"
                            type="text"
                            minLength={2}
                            maxLength={100}
                            required
                            value={newTitle}
                            onChange={(event) => setNewTitle(event.target.value)}
                            placeholder="제목을 입력하세요"
                        />
                        <div className="counter">{newTitle.length}/100</div>
                        <label htmlFor="post-content">내용</label>
                        <textarea
                            id="post-content"
                            minLength={10}
                            maxLength={5000}
                            required
                            value={newContent}
                            onChange={(event) => setNewContent(event.target.value)}
                            placeholder="10자 이상 입력해 주세요"
                        />
                        <div className="counter">{newContent.length}/5,000</div>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <button className="primary submit" type="submit" disabled={submitting || !authReady}>
                            {submitting ? '등록 중…' : viewer ? '게시글 등록' : '로그인 후 작성 가능'}
                        </button>
                    </form>
                )}

                <div className="search-box">
                    <label htmlFor="community-search">게시글 검색</label>
                    <input
                        id="community-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="제목이나 내용을 검색하세요"
                    />
                </div>

                {loading ? (
                    <div className="state" role="status">게시글을 불러오는 중입니다…</div>
                ) : loadError ? (
                    <div className="state card" role="alert">
                        <p>{loadError}</p>
                        <button type="button" className="primary" onClick={() => void fetchPosts()}>다시 시도</button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="state card">
                        <p>{searchQuery ? '검색 결과가 없습니다.' : '아직 게시글이 없습니다. 첫 글을 작성해 보세요.'}</p>
                        {searchQuery && <button type="button" className="primary" onClick={() => setSearchQuery('')}>검색 지우기</button>}
                    </div>
                ) : (
                    <section className="post-list" aria-label="커뮤니티 게시글">
                        {filteredPosts.map((post) => (
                            <article className="post-card" key={post.id}>
                                <Link className="post-link" href={`/community/${post.id}`}>
                                    <h2>{post.title}</h2>
                                    <p>{post.content}</p>
                                </Link>
                                <div className="post-footer">
                                    <div className="post-meta">
                                        <span className="author">{post.author}</span>
                                        <span>{timeAgo(post.createdAt)}</span>
                                        <span aria-label={`조회수 ${post.views}`}>조회 {post.views}</span>
                                        <span aria-label={`댓글 ${post.comments}`}>댓글 {post.comments}</span>
                                    </div>
                                    <div className="reaction-buttons" aria-label={`${post.title} 반응`}>
                                        <button
                                            type="button"
                                            className={reactions[post.id] === 'like' ? 'selected like' : 'like'}
                                            aria-pressed={reactions[post.id] === 'like'}
                                            disabled={reactionBusy[post.id]}
                                            onClick={() => void handleReaction(post.id, 'like')}
                                        >좋아요 {post.likes}</button>
                                        <button
                                            type="button"
                                            className={reactions[post.id] === 'dislike' ? 'selected dislike' : 'dislike'}
                                            aria-pressed={reactions[post.id] === 'dislike'}
                                            disabled={reactionBusy[post.id]}
                                            onClick={() => void handleReaction(post.id, 'dislike')}
                                        >싫어요 {post.dislikes}</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>

            <style jsx>{`
                .community-page { min-height: 100vh; padding: 2rem 1rem; background: var(--bg-gradient); }
                .community-shell { max-width: 900px; margin: 0 auto; }
                .community-header, .heading, .post-footer, .post-meta, .reaction-buttons { display: flex; align-items: center; }
                .community-header { justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
                .heading { gap: 1rem; color: white; }
                h1 { margin: 0 0 .25rem; font-size: clamp(1.65rem, 5vw, 2rem); text-shadow: var(--header-text-shadow); }
                .heading p { margin: 0; color: rgba(255,255,255,.87); font-size: .9rem; }
                .primary { min-height: 42px; padding: .6rem 1rem; border: 0; border-radius: .6rem; background: var(--primary); color: white; cursor: pointer; font-weight: 700; }
                .primary:disabled { cursor: not-allowed; opacity: .6; }
                button:focus-visible, input:focus-visible, textarea:focus-visible, :global(.post-link:focus-visible) { outline: 3px solid #ffd54f; outline-offset: 3px; }
                .guest-notice { margin-bottom: 1rem; padding: .8rem 1rem; border-radius: .75rem; background: rgba(255,255,255,.93); color: var(--text-primary); font-size: .9rem; }
                .write-form { margin-bottom: 1.5rem; padding: 1.4rem; border: 1px solid var(--border-color); border-radius: 1rem; background: var(--card-bg); box-shadow: var(--card-shadow); }
                .write-form h2 { margin: 0 0 1rem; color: var(--text-primary); font-size: 1.2rem; }
                label { display: block; margin-bottom: .4rem; color: var(--text-primary); font-weight: 700; }
                input, textarea { box-sizing: border-box; width: 100%; padding: .75rem; border: 1px solid var(--border-color); border-radius: .55rem; background: var(--background); color: var(--text-primary); font: inherit; }
                textarea { min-height: 150px; resize: vertical; }
                .counter { margin: .3rem 0 .8rem; color: var(--text-secondary); font-size: .75rem; text-align: right; }
                .form-error { margin: 0 0 .8rem; color: #c62828; }
                .submit { width: 100%; }
                .search-box { margin-bottom: 1.5rem; }
                .search-box label { color: white; }
                .search-box input { background: var(--card-bg); }
                .state { padding: 3rem 1rem; color: white; text-align: center; }
                .state.card { border: 1px solid var(--border-color); border-radius: 1rem; background: var(--card-bg); color: var(--text-secondary); box-shadow: var(--card-shadow); }
                .state p { margin: 0 0 1rem; }
                .post-list { display: grid; gap: 1rem; }
                .post-card { overflow: hidden; border: 1px solid var(--border-color); border-radius: 1rem; background: var(--card-bg); box-shadow: var(--card-shadow); }
                :global(.post-link) { display: block; padding: 1.35rem 1.35rem .8rem; color: inherit; text-decoration: none; }
                :global(.post-link h2) { margin: 0 0 .65rem; color: var(--text-primary); font-size: 1.1rem; line-height: 1.45; }
                :global(.post-link p) { display: -webkit-box; overflow: hidden; margin: 0; color: var(--text-secondary); font-size: .88rem; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
                .post-footer { justify-content: space-between; gap: 1rem; padding: .7rem 1.35rem 1.15rem; }
                .post-meta { flex-wrap: wrap; gap: .75rem; color: var(--text-secondary); font-size: .75rem; }
                .author { color: var(--text-primary); font-weight: 700; }
                .reaction-buttons { gap: .45rem; }
                .reaction-buttons button { min-height: 38px; padding: .35rem .7rem; border: 1px solid transparent; border-radius: 999px; cursor: pointer; font-weight: 600; }
                .reaction-buttons button:disabled { cursor: wait; opacity: .65; }
                .like { background: rgba(46,125,50,.1); color: #2e7d32; }
                .dislike { background: rgba(198,40,40,.1); color: #c62828; }
                .reaction-buttons .selected { border-color: currentColor; box-shadow: 0 0 0 1px currentColor inset; }
                @media (max-width: 640px) {
                    .community-page { padding: 1.2rem .75rem; }
                    .heading p { display: none; }
                    .post-footer { align-items: flex-start; flex-direction: column; }
                    .reaction-buttons { width: 100%; }
                    .reaction-buttons button { flex: 1; }
                }
            `}</style>
        </main>
    );
}
