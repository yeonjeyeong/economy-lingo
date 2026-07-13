# 경제 링고

경제 용어 퀴즈, 기간별 랭킹, 최근 경제 뉴스, 학습 캘린더, 커뮤니티와 오답 노트를 한곳에서 제공하는 한국어 경제 학습 앱입니다.

## 이번 보완본의 원칙

- 뉴스·캘린더·퀴즈는 로그인 없이 둘러볼 수 있습니다.
- 로그인한 사용자의 이메일과 개인 기록은 `users/{uid}`에 비공개로 저장합니다.
- 공개 랭킹은 이메일이 없는 `publicProfiles/{uid}`만 읽습니다.
- 관리자 권한은 클라이언트 이메일 목록이 아니라 Firebase Auth의 `admin` custom claim으로 판별합니다.
- 실시간 뉴스나 AI 문제 생성이 실패해도 검수된 학습 콘텐츠로 계속 이용할 수 있습니다.
- 오답 노트는 선택한 답과 함께 현재 브라우저에 저장되며 오답만 다시 풀 수 있습니다.

## 로컬 실행

Node.js 20.9 이상과 pnpm 11이 필요합니다.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`http://localhost:3000`에서 확인합니다. Firebase 환경 변수가 없어도 게스트 기능은 동작하며, 로그인·커뮤니티 쓰기·클라우드 랭킹 동기화만 비활성화됩니다.

## 환경 변수

`.env.example`을 참고해 Firebase Web SDK 값을 Vercel 환경 변수에 등록합니다. `GEMINI_API_KEY`는 선택 사항이며, 없거나 외부 API가 실패하면 서버가 검수된 문제 풀을 사용합니다.

## 보안 규칙 적용

코드를 배포하는 것만으로 이미 배포된 Firestore 규칙이 바뀌지는 않습니다. Firebase CLI로 반드시 규칙과 인덱스를 별도 배포해야 합니다.

```bash
firebase use economy-lingo
firebase deploy --only firestore:rules,firestore:indexes
```

배포 후 아래 비인증 요청이 `PERMISSION_DENIED`를 반환하는지 확인합니다.

```text
GET https://firestore.googleapis.com/v1/projects/economy-lingo/databases/(default)/documents/users?pageSize=1
```

관리자는 신뢰할 수 있는 서버 환경에서 Firebase Admin SDK로 사용자의 ID 토큰에 `admin: true` custom claim을 설정해야 합니다. 이메일을 프런트엔드에 하드코딩하지 않습니다.

## 검사

```bash
pnpm lint
pnpm build
```

배포 전 게스트/로그인 두 상태에서 퀴즈 완료, 일간·주간·전체 랭킹, 뉴스 실패 대체, 현재 월 캘린더, 커뮤니티 반응 토글, 댓글 작성·삭제, 오답 재도전을 확인합니다.

## 배포

Vercel 프로젝트의 Production Branch를 `main`으로 두고 위 환경 변수를 등록합니다. `main`에 반영된 뒤 Vercel 빌드가 성공하면 앱을 배포하고, 이어서 Firestore 규칙을 적용합니다.
