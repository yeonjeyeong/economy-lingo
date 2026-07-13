import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            posts: [],
            message: '커뮤니티 게시글은 로그인 상태와 권한을 안전하게 확인하기 위해 Firestore에서 직접 불러옵니다.'
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
