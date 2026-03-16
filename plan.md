# 헤아림 — Phase 1 개발 계획 (한다혜)

> **참조:** [research.md](./research.md)
> **범위:** Phase 1 전체 로드맵 + Week 1 상세 구현 계획

---

## Phase 1 로드맵 (W1~W4)

| 주차 | 목표 | 핵심 산출물 |
|---|---|---|
| **W1** | 프로젝트 초기화 + 공통 기반 | Next.js 앱, Supabase 연동, 레이아웃, 디자인 토큰 |
| **W2** | 인증 UI | GitHub OAuth 로그인 (회사 계정), 미들웨어, 세션 관리 |
| **W3** | 열람 페이지 전체 | 메인, 데일리/위클리 목록+상세, 검색 |
| **W4** | 작성 기능 + 배포 | AI 폼, 직접 작성, 초안 관리, Vercel 배포 |

### 의존 관계

```
W1 프로젝트 초기화
 ├── Supabase 클라이언트 연동 ← (이동익: DB 스키마 완료 후 환경 변수 공유)
 └── 디자인 시스템 + 레이아웃

W2 인증 (GitHub OAuth + 회사 계정)
 ├── 로그인 페이지 ← W1 레이아웃
 ├── Auth 콜백 라우트 ← W1 Supabase 클라이언트
 ├── 미들웨어 보호 라우트 ← W1 미들웨어
 └── GitHub Provider 설정 ← Supabase 대시보드 (이동익)

W3 열람 페이지
 ├── 데일리/위클리 목록+상세 ← W1 Supabase 클라이언트 + W2 인증(draft 열람)
 └── 검색 ← (이동익: FTS 쿼리 구현)

W4 작성 기능
 ├── AI 폼 ← (이동익: /api/generate 엔드포인트)
 ├── 직접 작성 ← W1 Supabase 클라이언트
 └── 초안 관리 ← W2 인증
```

---

## Week 1 상세 구현 계획

### 완료 기준

- `npm run dev`로 로컬에서 Next.js 앱 실행
- Supabase 연결 확인 (테이블 SELECT 쿼리 성공)
- 공통 레이아웃 + Header가 모든 페이지에 적용
- 이동익님과 동일한 `.env.local`로 개발 가능한 상태

---

### Step 1: 프로젝트 생성

현재 `hearim/` 폴더에 직접 초기화 (하위 폴더 생성 X):

```shell
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

npm install @supabase/ssr @supabase/supabase-js
npm install react-markdown remark-gfm
```

**결과물:** 기본 Next.js 15 프로젝트 + 필수 패키지

---

### Step 2: 환경 변수 설정

`.env.local` 생성 (이동익님에게 값 전달받기):

```shell
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

`.gitignore`에 `.env.local` 포함 확인 (create-next-app 기본 포함).

---

### Step 3: Supabase 클라이언트 설정

3개 파일 생성. Next.js App Router에서 Supabase를 사용하려면 브라우저/서버/미들웨어 각각 다른 클라이언트가 필요.

#### `src/lib/supabase/client.ts` — 브라우저용

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### `src/lib/supabase/server.ts` — 서버 컴포넌트용

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시 (읽기 전용)
          }
        },
      },
    }
  )
}
```

#### `src/lib/supabase/middleware.ts` — 세션 갱신용

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}
```

#### `middleware.ts` (프로젝트 루트)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**참고:** W1에서는 세션 갱신만 처리. 보호 라우트 리다이렉트 로직은 W2에서 추가.

---

### Step 4: TypeScript 타입 정의

이동익님이 Supabase 스키마 완료 후 자동 생성하는 것이 이상적:

```shell
npx supabase gen types typescript \
  --project-id <프로젝트ID> > src/types/database.ts
```

스키마 완료 전이면 수동으로 임시 타입 작성:

```typescript
// src/types/database.ts (임시 — 스키마 확정 후 자동 생성으로 교체)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      dailies: {
        Row: {
          id: string
          author_id: string
          title: string
          date: string
          content: string
          summary: string | null
          status: 'draft' | 'published'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['dailies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['dailies']['Insert']>
      }
      weeklies: {
        Row: {
          id: string
          title: string
          week_number: number
          week_start: string
          week_end: string
          content: string
          summary: string | null
          daily_count: number
          contributors: string[]
          status: 'draft' | 'published'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weeklies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weeklies']['Insert']>
      }
    }
  }
}
```

---

### Step 5: 디자인 시스템 기초

#### Tailwind 색상 토큰

`tailwind.config.ts`에 프로젝트 색상 정의. 구체적 컬러는 디자인 확정 시 조정.

```typescript
// tailwind.config.ts 내 theme.extend.colors
colors: {
  hearim: {
    primary: '...', // 포인트 컬러
    bg: '...',      // 배경
    text: '...',    // 본문
    muted: '...',   // 보조 텍스트
    border: '...',  // 테두리
  }
}
```

#### 폰트 설정

`src/app/layout.tsx`에서 Pretendard 또는 Geist Sans 적용.

---

### Step 6: 폴더 구조 생성

```
src/app/
  layout.tsx                    # 루트 레이아웃
  loading.tsx                   # 글로벌 로딩
  error.tsx                     # 글로벌 에러
  not-found.tsx                 # 404
  (public)/
    page.tsx                    # 메인 (빈 껍데기)
    daily/page.tsx              # (빈 껍데기)
    daily/[id]/page.tsx         # (빈 껍데기)
    weekly/page.tsx             # (빈 껍데기)
    weekly/[id]/page.tsx        # (빈 껍데기)
    search/page.tsx             # (빈 껍데기)
    login/page.tsx              # (빈 껍데기)
  (protected)/
    daily/new/page.tsx          # (빈 껍데기)
    daily/write/page.tsx        # (빈 껍데기)
    daily/drafts/page.tsx       # (빈 껍데기)
  api/
    generate/route.ts           # (빈 껍데기)
    keepalive/route.ts          # (빈 껍데기)
```

W1에서는 라우트 파일만 생성하고 빈 페이지 또는 "Coming Soon" 표시. W3~W4에서 구현.

---

### Step 7: 공통 레이아웃 + Header

#### `src/app/layout.tsx`

- HTML lang="ko"
- 폰트 적용
- `<Header />` 포함
- Supabase Auth 상태에 따라 로그인/로그아웃 버튼 분기

#### `src/components/layout/Header.tsx`

- 로고 (헤아림)
- 네비게이션: 데일리, 위클리, 검색
- 로그인/로그아웃 버튼 (인증 상태 기반)
- 모바일 반응형 (햄버거 메뉴 또는 간소화)

#### 공통 UI 컴포넌트 뼈대

- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Card.tsx`

최소한의 스타일만 적용. 디자인 확정 후 정교화.

---

### Step 8: Supabase 연결 검증

메인 페이지(`src/app/(public)/page.tsx`)에서 Supabase 연결 테스트:

```typescript
// 서버 컴포넌트에서
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('dailies').select('id').limit(1)

  // 연결 성공 여부 확인 후 제거
}
```

---

### Step 9: GitHub 리포 + 브랜치 전략

- 리포 생성 (이미 있으면 스킵)
- 브랜치 전략 합의: `main` / `dev` / `feature/*`
- 초기 커밋 후 이동익님과 공유

---

### Week 1 체크리스트

- [x] Step 1: 프로젝트 생성 + 패키지 설치
- [x] Step 2: `.env.local` 설정 (이동익님 환경 변수 수령)
- [x] Step 3: Supabase 클라이언트 3개 (`client.ts`, `server.ts`, `middleware.ts`) + 루트 `middleware.ts`
- [x] Step 4: `database.ts` 타입 정의 (임시 or 자동 생성)
- [x] Step 5: Tailwind 색상 토큰 + 폰트 설정
- [x] Step 6: 전체 라우트 폴더 구조 생성 (빈 껍데기)
- [x] Step 7: `layout.tsx` + `Header` + 공통 UI 컴포넌트 뼈대
- [x] Step 8: Supabase 연결 검증 (SELECT 쿼리 성공)
- [x] Step 9: GitHub 리포 + 브랜치 전략 합의 + 초기 커밋

### 이동익님과의 협업 포인트 (W1)

| 필요한 것 | 시점 | 내용 |
|---|---|---|
| 환경 변수 | Step 2 | `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` |
| DB 스키마 완료 확인 | Step 4 | `supabase gen types` 실행 가능 여부 |
| 브랜치 전략 | Step 9 | `main`/`dev`/`feature/*` 합의 |

---

## Week 2 상세 구현 계획

### 인증 방식: GitHub OAuth (회사 계정)

Magic Link 대신 **GitHub OAuth**를 사용합니다. 회사 GitHub 계정으로 로그인하는 방식입니다. (3/4 회의 결정)

#### 로그인 흐름

```
[로그인 페이지 /login]
  "회사 계정으로 로그인" 버튼 클릭 (GitHub 아이콘)
       ↓
[GitHub OAuth 로그인 창]
  회사 GitHub 계정으로 로그인
       ↓
[Supabase가 인증 처리]
  GitHub에서 토큰 수신 → Supabase 세션 생성
       ↓
[/auth/callback]
  URL의 code를 세션 쿠키로 교환
       ↓
[메인 페이지로 리다이렉트]
  로그인 완료!
```

#### 보호 라우트 흐름

```
[사용자가 /daily/new 접근]
       ↓
[미들웨어가 세션 확인]
  ├── 세션 있음 → 통과
  └── 세션 없음 → /login?redirectTo=/daily/new 로 리다이렉트
```

---

### 완료 기준

- GitHub 계정으로 로그인/로그아웃 동작
- 보호 라우트(`/daily/new`, `/daily/write`, `/daily/drafts`) 미인증 시 로그인 페이지로 이동
- 로그인 후 원래 가려던 페이지로 리다이렉트
- Header에 로그인 상태 반영 (로그인/로그아웃 버튼 전환)

---

### Step 1: 로그인 페이지 UI

`src/app/(public)/login/page.tsx`

- "헤아림" 로고 + 설명 텍스트
- "회사 계정으로 로그인" 버튼 (GitHub 아이콘)
- `회사 GitHub 계정으로 로그인해주세요` 안내 문구
- 버튼 클릭 시 `supabase.auth.signInWithOAuth({ provider: 'github' })` 호출

---

### Step 2: Auth 콜백 라우트

`src/app/auth/callback/route.ts`

- Google 로그인 완료 후 Supabase가 리다이렉트하는 엔드포인트
- URL의 `code` 파라미터를 Supabase 세션(쿠키)으로 교환
- 성공 시 `redirectTo` 파라미터가 있으면 해당 경로로, 없으면 `/`로 이동

---

### Step 3: 미들웨어 보호 라우트 추가

`src/middleware.ts` 수정

- 기존 세션 갱신 로직 유지
- `(protected)` 그룹 경로(`/daily/new`, `/daily/write`, `/daily/drafts`)에 대해:
  - 세션이 없으면 `/login?redirectTo={현재경로}`로 리다이렉트
  - 세션이 있으면 통과

---

### Step 4: Header 로그인 상태 반영

`src/components/layout/HeaderWrapper.tsx` + `Header.tsx` 수정

- 서버에서 `supabase.auth.getUser()`로 로그인 상태 확인
- 로그인 상태: 사용자 이름/이메일 표시 + 로그아웃 버튼
- 비로그인 상태: 로그인 버튼
- 로그아웃: `supabase.auth.signOut()` 후 `/`로 리다이렉트

---

### Step 5: 전체 흐름 테스트

- 비로그인 상태에서 보호 라우트 접근 → 로그인 페이지 이동 확인
- GitHub 로그인 → 콜백 → 메인 페이지 도착 확인
- Header 로그인/로그아웃 상태 전환 확인
- 로그아웃 후 보호 라우트 접근 차단 확인
- 로그인 후 내 draft 목록 접근 가능 확인

---

### Week 2 체크리스트

- [x] Step 1: 로그인 페이지 UI (GitHub OAuth 버튼)
- [x] Step 2: `/auth/callback` 라우트 (code → 세션 교환)
- [x] Step 3: 미들웨어 보호 라우트 (미인증 시 `/login`으로 리다이렉트)
- [x] Step 4: Header 로그인 상태 반영 (로그인/로그아웃 전환)
- [x] Step 5: 전체 흐름 테스트 (✅ Supabase GitHub Provider 설정 완료)
  - [x] 비로그인 → `/daily/new` 접근 → `/login?redirectTo=/daily/new`로 이동
  - [x] 로그인 버튼 클릭 → GitHub → 콜백 → 원래 페이지로 도착
  - [x] Header에 이메일 + 로그아웃 버튼 표시
  - [x] 로그아웃 클릭 → Header가 로그인 버튼으로 전환
  - [x] 로그아웃 후 보호 라우트 접근 차단 확인

---

### 이동익님에게 요청할 사항 (W2)

> **3/4 회의 결정사항 기반 — 다음 회의 때 확인 후 요청**

#### 1. Supabase GitHub OAuth Provider 설정

Supabase Dashboard → Authentication → Providers → GitHub 활성화가 필요합니다.

**필요한 작업:**

1. **GitHub** (https://github.com/settings/developers)
   - Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: `hearim` (또는 적절한 이름)
   - Homepage URL: 배포 URL (또는 `http://localhost:3000`)
   - Authorization callback URL:
     ```
     https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
   - 생성된 **Client ID**와 **Client Secret** 복사
   - **참고:** 무신사 GitHub Organization의 OAuth App으로 만들지, 개인 계정으로 만들지 확인 필요

2. **Supabase Dashboard** (https://supabase.com/dashboard)
   - Authentication → Providers → GitHub → Enable
   - Client ID, Client Secret 입력

#### 2. Draft DB 분리 검토 (3/4 회의 결정)

- publish 후 draft DB에서 **제거**되어야 함
- draft와 published를 같은 테이블(`status` 컬럼)로 관리할지, 별도 테이블로 분리할지 결정 필요
- 현재 `dailies` 테이블에 `status: 'draft' | 'published'`로 되어 있음 — 분리 시 타입 변경 필요

#### 3. 접근 제한 방식 확인

- 회사 GitHub 계정이면 누구나 로그인 가능한지?
- Organization 멤버십 기반 제한이 필요한지?
- 추후 특정 팀/멤버만 접근하도록 제한할 계획이 있는지?

---

## Week 3 상세 구현 계획

### 현재 상태 (W2 종료 시점)

| 기능 | 상태 | 비고 |
|---|---|---|
| 홈 페이지 (/) | ✅ 완료 | 최근 데일리 5건 + 로그인 시 초안 표시 |
| 데일리 목록 (/daily) | ✅ 완료 | published 목록, 작성자 이름 표시 |
| 데일리 상세 (/daily/[id]) | ✅ 완료 | 마크다운 렌더링, 소유자만 초안 열람, DraftActions |
| 내 초안 (/daily/drafts) | ✅ 완료 | 보호 라우트, 확정/삭제 기능 |
| 로그인 (/login) | ✅ 완료 | GitHub OAuth (Provider 설정 대기) |
| Header | ✅ 완료 | 반응형, 인증 상태 반영 |
| 위클리 목록 (/weekly) | ❌ 빈 껍데기 | 구현 필요 |
| 위클리 상세 (/weekly/[id]) | ❌ 빈 껍데기 | 구현 필요 |
| 검색 (/search) | ❌ 빈 껍데기 | 이동익님 FTS 의존 |

### W3 목표

W3 원래 범위(열람 페이지 전체)에 **3/9 회의 액션 아이템**을 반영합니다.

1. 작성자 이름 노출 버그 수정 (회의 액션)
2. 확정 게시물에 삭제 버튼 추가 (회의 액션, W4에서 당김)
3. 위클리 목록 + 상세 페이지 구현
4. 검색 페이지 기본 구현
5. 프롬프트 고도화.md / skill 문서 고도화 (회의 액션, 문서 작업)

---

### Step 1: 작성자 이름 노출 버그 수정

**문제:** 로그인 후 전체 공개 페이지(홈, 데일리 목록)에서 작성자 이름이 안 보이는 경우 있음.
현재 작성자 게시물에서는 이름이 노출되나, 다른 작성자 게시물에서 이름이 누락됨.

**확인 사항:**
- `profiles(name)` join이 모든 쿼리에서 정상 동작하는지 점검
- RLS 정책이 profiles 테이블 읽기를 제한하고 있는지 확인
- 로그인/비로그인 상태 모두에서 작성자 이름 표시 테스트

**수정 대상 파일:**
- `src/app/page.tsx` — 홈 페이지 데일리 쿼리
- `src/app/(public)/daily/page.tsx` — 데일리 목록 쿼리
- `src/app/(public)/daily/[id]/page.tsx` — 데일리 상세 쿼리
- (필요 시) Supabase RLS 정책 — 이동익님 확인 요청

---

### Step 2: 확정 게시물 삭제 버튼 추가

**문제:** 초안 → 확정(publish) 후에도 작성자가 게시물을 삭제할 수 있어야 함.

**현재 상태:**
- `DraftActions` 컴포넌트에 확정/삭제 버튼 존재 (초안에서만 노출)
- 확정된 게시물 상세에서는 삭제 버튼 없음

**구현:**
- 데일리 상세 페이지에서 `isOwner && daily.status === 'published'`일 때 삭제 버튼 표시
- 기존 `DraftActions`를 확장하거나, 별도 `PostActions` 컴포넌트 분리
- 삭제 시 확인 다이얼로그 필수
- 삭제 후 `/daily` 목록으로 리다이렉트

**수정 대상 파일:**
- `src/app/(public)/daily/[id]/page.tsx`
- `src/components/daily/DraftActions.tsx` (또는 새 PostActions 컴포넌트)

---

### Step 3: 위클리 목록 페이지 구현

`src/app/(public)/weekly/page.tsx`

- Supabase에서 published 위클리 목록 조회
- `weeklies` 테이블: title, week_number, week_start, week_end, summary, daily_count, contributors
- 주차별 카드 형태 (데일리 목록과 유사한 패턴)
- 기간(week_start ~ week_end), 참여자 수, 데일리 건수 표시
- 데이터 없을 때 빈 상태 메시지

---

### Step 4: 위클리 상세 페이지 구현

`src/app/(public)/weekly/[id]/page.tsx`

- Supabase에서 단일 위클리 조회
- 마크다운 렌더링 (ReactMarkdown + remarkGfm, 데일리 상세와 동일 패턴)
- 메타 정보: 주차, 기간, 참여자, 포함된 데일리 수
- 포함된 데일리 목록 링크 (가능하면)
- draft 위클리는 권한 있는 사용자만 열람 (데일리와 동일 로직)

---

### Step 5: 검색 페이지 기본 구현

`src/app/(public)/search/page.tsx`

- 검색 입력 폼 (쿼리 파라미터 `?q=` 사용)
- **Phase A (프론트 단독):** 클라이언트 사이드 필터링 — 제목/요약 기준 `.ilike()` 쿼리
- **Phase B (이동익님 FTS 완료 후):** Supabase Full-Text Search RPC 호출로 교체
- 검색 결과를 데일리/위클리 카드로 표시
- 빈 결과 / 초기 상태 UI

**이동익님 의존:** FTS 쿼리 구현 (`search_dailies` RPC 등)
→ Phase A로 먼저 구현하고, FTS 완료 시 교체

---

### Step 6: 프롬프트 / skill 문서 고도화

- `고도화.md` 프롬프트 개선 (대외비 제외, 기술 내용만)
- skill 문서 정리
- 코드 작업이 아닌 **문서 작업** — 별도 시간 배분

---

### Week 3 체크리스트

- [x] Step 1: 작성자 이름 노출 버그 수정 (✅ profiles RLS → `true`로 변경, 2026-03-11)
- [x] Step 2: 확정 게시물 삭제 버튼 추가 (PostActions.tsx)
- [x] Step 3: 위클리 목록 페이지 구현
- [x] Step 4: 위클리 상세 페이지 구현
- [x] Step 5: 검색 페이지 구현 (Phase A: ilike → ✅ Phase B: FTS RPC 교체 완료)
- [x] Step 6: 프롬프트 / skill 문서 고도화 (README.md 업데이트, 스킬 시스템 main merge — PR #9)

### 이동익님에게 확인/요청 사항 (W3)

| 필요한 것 | Step | 내용 | 상태 |
|---|---|---|---|
| profiles RLS 정책 확인 | Step 1 | 다른 사용자의 `profiles.name` SELECT가 가능한지 | ✅ 해결 (RLS → `true`로 변경, 2026-03-11) |
| 위클리 테스트 데이터 | Step 3~4 | `weeklies` 테이블에 published 상태 데이터가 있는지 | ❓ 미확인 |
| FTS 쿼리 (Phase B) | Step 5 | `search_dailies` RPC + 프론트 코드 교체 완료 | ✅ 완료 |
| 수정 기능 (에디터) | (W4) | 동익님 담당 — BlockNote 에디터 도입 검토 중 | 동익님 담당 |

---

### 3/9 회의 결정사항 반영 메모

> 회의 액션 아이템 (다혜님 담당)

- **작성자 이름:** 전체 공개 페이지에서 작성자 이름 노출 → Step 1
- **삭제 버튼:** 확정 게시물에 삭제 버튼 추가 → Step 2
- **문서 고도화:** 프롬프트 고도화.md + skill 문서 → Step 6

> 회의 액션 아이템 (동익님 담당)

- 로컬 커맨드 연동 테스트 + 문서화
- 수정 클릭 시 에디터로 수정 기능 추가

### 스킬 시스템 리뷰 반영 (2026-03-15)

- ✅ detect-env.sh 상대 경로 → SKILL.md 인라인 포함 (글로벌 설치 호환)
- ✅ hearim-push 완료 URL localhost → hearim.vercel.app
- ✅ install-skills.sh Supabase URL 복원 (공개 정보), key만 플레이스홀더
- ✅ collectors.md 문구 수정 + 첫 실행 판별 기준 명확화
- ✅ 위클리 모드: Git 수집하지 않음 명시

#### TODO: hearim-push 인증 방식 변경 (service role key → anon key + 로그인 토큰)

현재 `/hearim-push`는 service role key(관리자 키)를 사용하며, 신규 사용자마다 key를 DM 전달해야 한다.
다수 사용자 대응을 위해 anon key + 사용자 로그인 토큰 방식으로 전환 필요.

**필요한 작업:**
1. CLI에서 Supabase 로그인 흐름 구현 — GitHub OAuth → 토큰을 `~/.hearim-session`에 저장 (다혜님)
2. `hearim-push/SKILL.md` 수정 — service role key 대신 anon key + 저장된 토큰으로 curl 호출 (다혜님)
3. dailies 테이블 `INSERT` RLS 정책 확인 — `auth.uid() = author_id` 필요 (**이동익님**)
4. 토큰 갱신 로직 (refresh token) 추가 (다혜님)
5. `install-skills.sh`에서 `HEARIM_SERVICE_ROLE_KEY` 제거, anon key로 교체

> **우선순위:** 사용자가 늘어나기 전에 전환. 이동익님과 다음 회의에서 RLS 정책 확인 후 착수.

---

## Week 3 이후 추가 완료 작업

### 스킬 시스템 (feature/hearim-skill)

- ✅ `.claude/commands` → `.claude/skills` 마이그레이션 (PR #9, 2026-03-13)
- ✅ 스킬 피드백 반영 — 데일리 출력 간소화, 수집경로 범용화 (PR #11, #12)
  - git log 형식 간소화: `%s (%ai)` 만 출력 (해시/stat 제거)
  - Jira 티켓 번호만 포함, 커밋 해시/줄수/파일경로 제외
  - config 미설정 시 `~/Documents/*/` 하위 git 레포 자동 탐색
- ✅ SKILL.md 환경 감지 스크립트 경로 수정 (PR #10)

### 인프라 / 배포

- ✅ 프로필 자동 생성 — GitHub 로그인 시 service role admin 클라이언트로 profiles 자동 생성
- ✅ Shadcn-dashboard 업그레이드 (PR #7)
- ✅ Daily-edit 기능 (PR #6)
- ✅ Vercel 배포 + 환경 변수 설정 완료

---

## Phase 1 진행 현황 요약 (2026-03-15)

| 주차 | 목표 | 상태 | 비고 |
|---|---|---|---|
| **W1** | 프로젝트 초기화 + 공통 기반 | ✅ 완료 | Next.js, Supabase, 레이아웃, 디자인 토큰 |
| **W2** | 인증 UI | ✅ 완료 | GitHub OAuth, 미들웨어, 세션 관리, 프로필 자동 생성 |
| **W3** | 열람 페이지 전체 | ✅ 완료 | 위클리, 검색(FTS), 버그 수정, 스킬 시스템 |
| **W4** | 작성 기능 + 배포 | ⏳ 미착수 | AI 폼, 직접 작성, 초안 관리 |

### W4 남은 작업

- [ ] AI 생성 폼 (`/daily/new`) — 이동익님 `/api/generate` 엔드포인트 의존
- [ ] 직접 작성 폼 (`/daily/write`)
- [ ] 초안 관리 고도화 (편집 기능 — 동익님 BlockNote 에디터 검토 중)
- [ ] Vercel 프로덕션 배포 최종 확인

### 데일리 필터 기능 (2026-03-15)

- ✅ 1단계: `전체보기` / `내것만 보기` 필터 구현 완료
- ✅ 2단계: `우리 팀` 필터 프론트 코드 구현 완료
- ✅ DB 작업: `teams` 테이블 생성, `profiles.team_id` 컬럼 추가, 수동 팀 배정 완료

### 페이지 내 검색 기능 (2026-03-15)

- ✅ 데일리 목록: `search_dailies` FTS RPC 활용 (제목+내용 전체 검색, 디바운스 300ms)
- ✅ 위클리 목록: 클라이언트 필터링 (제목+내용+요약 검색)
- 검색 입력 UI: 데일리는 필터 탭 옆, 위클리는 목록 상단에 배치

#### 이동익님 협조 필요: GitHub Org 팀 자동 연동

현재 팀 배정은 수동(SQL)이며, 신규 가입자는 `team_id = NULL` 상태로 등록됩니다.
자동 연동을 위해 아래 작업이 필요합니다:

1. **코드 변경** — 로그인 시 `signInWithOAuth`에 `scopes: 'read:org'` 추가 (다혜님 작업 가능)
2. **GitHub OAuth App 설정** — musinsa-dongik Organization에서 해당 OAuth App에 Organization access 승인 (Org 관리자 권한 필요 — **이동익님**)
3. **콜백 로직 추가** — `/auth/callback`에서 GitHub Teams API(`/user/teams`) 호출 → `teams` 테이블 매칭 → `profiles.team_id` 자동 업데이트 (다혜님 작업 가능)

> **우선순위:** 당장은 수동 배정으로 운영 가능. 사용자가 늘어나면 자동 연동 검토.

---

### 3/4 회의 결정사항 반영 메모

> 회의록: https://wiki.team.musinsa.com/wiki/spaces/~dongik.lee/pages/330141059

- **로그인:** GitHub 회사 계정 사용 (Google → GitHub 변경)
- **Draft 관리:** 로그인 후 내 draft 목록 제공, publish 시 draft에서 제거, UI에서 draft 섹션 분리
- **브랜치:** `feature` 브랜치 → PR + 코드 리뷰
- **다혜님 액션:** 로그인 페이지 작업 + daily prompt 고도화 (대외비 제외, 기술 내용만)
