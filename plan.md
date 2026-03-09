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

- [ ] Step 1: 프로젝트 생성 + 패키지 설치
- [ ] Step 2: `.env.local` 설정 (이동익님 환경 변수 수령)
- [ ] Step 3: Supabase 클라이언트 3개 (`client.ts`, `server.ts`, `middleware.ts`) + 루트 `middleware.ts`
- [ ] Step 4: `database.ts` 타입 정의 (임시 or 자동 생성)
- [ ] Step 5: Tailwind 색상 토큰 + 폰트 설정
- [ ] Step 6: 전체 라우트 폴더 구조 생성 (빈 껍데기)
- [ ] Step 7: `layout.tsx` + `Header` + 공통 UI 컴포넌트 뼈대
- [ ] Step 8: Supabase 연결 검증 (SELECT 쿼리 성공)
- [ ] Step 9: GitHub 리포 + 브랜치 전략 합의 + 초기 커밋

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
- [ ] Step 5: 전체 흐름 테스트 (**Supabase GitHub Provider 설정 후 진행**)
  - [ ] 비로그인 → `/daily/new` 접근 → `/login?redirectTo=/daily/new`로 이동
  - [ ] 로그인 버튼 클릭 → GitHub → 콜백 → 원래 페이지로 도착
  - [ ] Header에 이메일 + 로그아웃 버튼 표시
  - [ ] 로그아웃 클릭 → Header가 로그인 버튼으로 전환
  - [ ] 로그아웃 후 보호 라우트 접근 차단 확인

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

### 3/4 회의 결정사항 반영 메모

> 회의록: https://wiki.team.musinsa.com/wiki/spaces/~dongik.lee/pages/330141059

- **로그인:** GitHub 회사 계정 사용 (Google → GitHub 변경)
- **Draft 관리:** 로그인 후 내 draft 목록 제공, publish 시 draft에서 제거, UI에서 draft 섹션 분리
- **브랜치:** `feature` 브랜치 → PR + 코드 리뷰
- **다혜님 액션:** 로그인 페이지 작업 + daily prompt 고도화 (대외비 제외, 기술 내용만)
