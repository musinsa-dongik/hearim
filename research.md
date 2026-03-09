# 헤아림 문서 사이트 - 기획서 리서치 노트

> **출처:** [헤아림 문서 사이트 PRD (v4.2)](https://wiki.team.musinsa.com/wiki/spaces/~dongik.lee/pages/324961962) + [Phase 1 개발 일정](https://musinsa-oneteam.atlassian.net/wiki/spaces/~dongik.lee/pages/324700337)
> **작성자:** 이동익, 한다혜 | **날짜:** 2026-02-27

---

## 1. 프로젝트 개요

### 헤아림이란?

"내가 안다고 생각한 것을, 말로 헤아려보는 시간" — 메타인지 스터디 플랫폼.

- **운영 방식:** 주 1회 (30분+), 1인당 10분 설명 + 질문
- **핵심 철학:** "설명할 수 없다면, 이해한 것이 아니다"
- **목표:** "어렴풋이 아는 상태" → "명확히 이해한 상태"로 전환

### 핵심 원칙

**스터디원은 데일리만 쓴다. 위클리는 AI가 만든다.**

---

## 2. 시스템 아키텍처

### 데일리 작성 — 3가지 경로

| | 경로 A: Claude Code | 경로 B: AI 폼 | 경로 C: 직접 작성 |
|---|---|---|---|
| **입력** | `/hearim-daily` 한 줄 | 키워드/메모 | 마크다운 전체 |
| **AI** | Claude (대화 맥락 100% 반영) | Gemini 2.5 Flash (키워드 기반) | 없음 |
| **내용 풍부도** | 최고 | 중간 | 본인 역량 |
| **속도** | 가장 빠름 | 빠름 | 느림 (정성) |
| **필요 도구** | Claude Code + Supabase MCP | 브라우저 | 브라우저 |
| **사용 시점** | Claude Code로 학습한 날 (주력) | Claude Code 안 쓴 날 | 기술 문서 꼼꼼히 정리할 때 |

모든 경로 공통 흐름: **draft → 사이트에서 확인/수정 → publish**

### 위클리 자동 생성

```
매주 월요일 09:00 KST (GitHub Actions Cron)
→ Supabase에서 지난주 published 데일리 전체 조회
→ 0건이면 스킵
→ Gemini에 전달 → 팀 위클리 마크다운 생성
→ Supabase weeklies 테이블에 INSERT (published)
```

---

## 3. 기술 스택 & 비용

| 구분 | 기술 | 비용 |
|---|---|---|
| Framework | Next.js 15 (App Router) | 무료 |
| Language | TypeScript 5 | 무료 |
| Styling | Tailwind CSS 4 | 무료 |
| DB | Supabase (PostgreSQL) Free Tier | 무료 |
| 인증 | Supabase Auth (Magic Link) | 무료 |
| AI (사이트) | Gemini 2.5 Flash Free Tier | 무료 |
| AI (CLI) | Claude Code + Supabase MCP | 기존 구독 |
| 배포 | Vercel Hobby Plan | 무료 |
| 스케줄러 | GitHub Actions | 무료 |
| 마크다운 | react-markdown + remark-gfm | 무료 |
| Email (Phase 2) | Resend | 무료 |

**예상 월 운영비: $0** (Claude Code 기존 구독 제외)

### 무료 티어 제약 & 대응

| 서비스 | 제한 | 대응 |
|---|---|---|
| Supabase Free | 500MB, 7일 비활성 시 일시중지 | 텍스트 중심 충분 + Vercel Cron keepalive |
| Gemini Free | 10 RPM, 250 RPD | 일 10~20건으로 충분 |
| Vercel Hobby | Cron 2개, 10초 함수 | 1개: keepalive. AI 생성은 스트리밍 |
| GitHub Actions Free | 2,000분/월 | 위클리 주 1회 → 충분 |

---

## 4. DB 스키마

### 테이블 구조 (5개)

```sql
-- 1. profiles (auth.users 트리거로 자동 생성)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. allowed_emails (스터디원 제한)
CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY
);

-- 3. dailies (핵심 테이블)
CREATE TABLE dailies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,             -- "2026.01.14 (화)"
  date DATE NOT NULL,
  content TEXT NOT NULL,           -- 마크다운 원문
  summary TEXT,                    -- 1줄 요약 (목록용)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. weeklies (AI 자동 생성)
CREATE TABLE weeklies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,             -- "3주차: 01.13 ~ 01.19"
  week_number INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content TEXT NOT NULL,           -- AI 생성 마크다운
  summary TEXT,
  daily_count INT DEFAULT 0,
  contributors UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. weekly_dailies (중간 테이블)
CREATE TABLE weekly_dailies (
  weekly_id UUID REFERENCES weeklies(id) ON DELETE CASCADE,
  daily_id UUID REFERENCES dailies(id) ON DELETE CASCADE,
  PRIMARY KEY (weekly_id, daily_id)
);
```

### 인덱스 + Full-Text Search

```sql
CREATE INDEX idx_dailies_date ON dailies(date DESC);
CREATE INDEX idx_dailies_status ON dailies(status);
CREATE INDEX idx_dailies_author ON dailies(author_id);
CREATE INDEX idx_weeklies_week ON weeklies(week_start DESC);

-- FTS (한국어 포함 simple 설정)
ALTER TABLE dailies ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
  ) STORED;
CREATE INDEX idx_dailies_fts ON dailies USING gin(fts);
```

### RLS 정책

```sql
ALTER TABLE dailies ENABLE ROW LEVEL SECURITY;

-- 누구나 published 열람
CREATE POLICY "Anyone can read published dailies"
  ON dailies FOR SELECT USING (status = 'published');

-- 작성자 본인 draft 열람
CREATE POLICY "Authors can read own drafts"
  ON dailies FOR SELECT USING (auth.uid() = author_id);

-- 스터디원만 작성
CREATE POLICY "Authenticated users can insert dailies"
  ON dailies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 본인 글만 수정
CREATE POLICY "Authors can update own dailies"
  ON dailies FOR UPDATE USING (auth.uid() = author_id);

ALTER TABLE weeklies ENABLE ROW LEVEL SECURITY;

-- 누구나 위클리 열람 (AI가 service_role_key로 생성)
CREATE POLICY "Anyone can read weeklies"
  ON weeklies FOR SELECT USING (status = 'published');
```

### profiles 자동 생성 트리거

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM allowed_emails WHERE email = NEW.email
  ) THEN
    RAISE EXCEPTION 'Email not allowed';
  END IF;

  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 5. 사이트 페이지 구성

| 페이지 | 경로 | 접근 |
|---|---|---|
| 메인 | `/` | 누구나 |
| 데일리 목록 | `/daily` | 누구나 |
| 데일리 상세 | `/daily/[id]` | 누구나 |
| 데일리 AI 작성 (경로 B) | `/daily/new` | 스터디원 |
| 데일리 직접 작성 (경로 C) | `/daily/write` | 스터디원 |
| 내 초안 | `/daily/drafts` | 스터디원 |
| 위클리 목록 | `/weekly` | 누구나 |
| 위클리 상세 | `/weekly/[id]` | 누구나 |
| 검색 | `/search` | 누구나 |
| 로그인 | `/login` | 누구나 |

### API Routes

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/generate` | POST | Gemini로 데일리 마크다운 생성 (경로 B) |
| `/api/keepalive` | GET | Supabase 일시중지 방지 핑 |

- Supabase CRUD는 JS Client 직접 처리 (RLS가 권한 제어)
- Claude Code MCP는 Supabase 직접 INSERT (API Route 불필요)

---

## 6. 인증 설계

- **방식:** Supabase Auth — Magic Link (이메일 로그인)
- **비밀번호 불필요:** 이메일 입력 → Magic Link 발송 → 클릭 → 인증 완료
- **접근 제한:** `allowed_emails` 테이블로 스터디원만 가입 가능
- **프로필 자동 생성:** `on_auth_user_created` 트리거가 `profiles` 행 자동 INSERT
- **Claude Code MCP:** `SUPABASE_SERVICE_ROLE_KEY` 사용 → RLS 바이패스, `author_id` 명시 지정

---

## 7. 데일리/위클리 양식

### 데일리 표준 양식

```markdown
## 헤아림 데일리: YYYY.MM.DD (요일)

### 오늘의 작업 (Context)
**이슈:** 오늘 대화에서 다룬 문제 상황
**해결:** 어떻게 해결했는지

### 오늘의 배움 카드 (Concepts)
#### 1. 개념 이름
3~5문장 설명
**패턴:** 코드 패턴이나 사용법
**언제 쓰는가?** 사용 시점

### 튜터의 한마디
핵심 포인트를 한 문장으로
```

### 위클리 표준 양식 (AI 자동)

- 이번 주 한눈에 보기 (참여 스터디원, 총 데일리 수, 주요 키워드)
- 스터디원별 요약 (주요 작업, 핵심 배움, 성장 포인트)
- 이번 주 연결고리 (겹치거나 연결되는 주제 분석)
- 다음 주 추천 토론 주제
- 원본 데일리 링크

---

## 8. Claude Code 연동 (경로 A)

### MCP 세팅 (최초 1회)

```json
// .claude/mcp.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "xxxxx"
      }
    }
  }
}
```

### 커스텀 슬래시 커맨드

- 파일: `.claude/commands/hearim-daily.md`
- 동작: 오늘 Claude Code 대화 맥락 기반으로 데일리 자동 작성
- 저장: Supabase `dailies` 테이블에 draft 상태로 INSERT

---

## 9. 구현 계획

### Phase 1: 핵심 기능 (4주)

**역할 분담:**
- **이동익:** 백엔드, 인프라, CLI (Supabase, MCP, GitHub Actions)
- **한다혜:** 프론트엔드, UI, 배포 (Next.js, Tailwind, Vercel)

| 주차 | 이동익 | 한다혜 |
|---|---|---|
| **W1** | Supabase 스키마/RLS/인덱스/FTS/트리거 | Next.js 초기화, Supabase 클라이언트 연동, 디자인 시스템, 폴더 구조, 공통 레이아웃 |
| **W2** | Magic Link 인증, MCP 세팅, `/hearim-daily` 커맨드 | 로그인 페이지, 인증 미들웨어, 세션 관리 |
| **W3** | `/api/keepalive`, 검색 API 로직, 위클리 스크립트 초안 | 메인 페이지, 데일리/위클리 목록+상세, 검색 페이지 |
| **W4** | `/api/generate` (Gemini), Vercel Cron, GitHub Secrets | AI 폼, 직접 작성, 초안 관리, Vercel 배포 |

### Phase 2: 자동화 + 고급 기능 (4주)

| 주차 | 작업 |
|---|---|
| W5 | 위클리 자동 생성 (GitHub Actions Cron + Gemini) |
| W6 | Keepalive + 안정화 + 에러 핸들링 |
| W7-8 | AI 퀴즈 메일링 (Gemini 퀴즈 생성 + Resend 발송) |

---

## 10. 환경 변수 정리

```shell
# === 필수 (Phase 1) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
GEMINI_API_KEY=xxxxx

# === Phase 2 ===
RESEND_API_KEY=xxxxx

# === GitHub Actions Secrets ===
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, RESEND_API_KEY

# === Claude Code MCP (.claude/mcp.json) ===
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

---

## 11. Cron / 스케줄 정리

| 작업 | 실행 위치 | 빈도 |
|---|---|---|
| Supabase keepalive | Vercel Cron | 매일 1회 |
| 위클리 자동 생성 | GitHub Actions | 매주 월 09:00 KST |
| (Phase 2) 퀴즈 발송 | GitHub Actions | 매일/주간 |

---

## 12. 성공 지표

### Phase 1
- 데일리 작성 자동화율: 80%+ (경로 A/B 사용)
- 일일 업로드 성공률: 95%+
- 평균 데일리 작성 시간: 5분 이내 (경로 A 기준)

### Phase 2
- 위클리 자동 생성 성공률: 100%
- 퀴즈 메일 오픈률: 50%+
- 스터디원 주간 데일리 작성 빈도: 3회+

---

## 13. 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| Supabase 7일 비활성 일시중지 | Vercel Cron keepalive + 공개 사이트 트래픽 |
| Supabase 500MB 제한 | 텍스트 중심 → 충분. 부족 시 Pro $25/월 |
| Gemini 무료 티어 축소 | Flash-Lite 전환 또는 Tier 1 ($1 미만/월) |
| AI 위클리 품질 | 프롬프트 튜닝 + 수동 편집 가능 |
| Claude Code MCP 세팅 부담 | 최초 1회, JSON 파일 하나 |
| GitHub Actions 장애 | `workflow_dispatch`로 수동 재실행 |

---

## 14. 향후 확장 계획

| 단계 | 내용 | 상태 |
|---|---|---|
| ADR-002 | 마크다운 렌더링 (코드 하이라이팅) | 예정 |
| ADR-003 | 검색 고도화 (한국어 형태소 분석) | 예정 |
| ADR-004 | AI 퀴즈 시스템 설계 (Phase 2) | 예정 |
| 향후 | 학습 패턴 분석 및 기술 성장 트렌드 시각화 | 검토 |
| 향후 | GitHub 연동 자동 진행률 추적 | 검토 |
| 향후 | 모바일 대응 (반응형 우선, 이후 PWA 검토) | 검토 |

---

## 15. 프로젝트 초기 세팅 커맨드

```shell
# 프로젝트 생성
npx create-next-app@latest hearim \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd hearim

# 필수 패키지 설치
npm install @supabase/ssr @supabase/supabase-js
npm install react-markdown remark-gfm

# Supabase 타입 생성
npx supabase gen types typescript \
  --project-id <프로젝트ID> > src/types/database.ts
```

### 전체 프로젝트 폴더 구조

```
hearim/
│
├── .claude/                            # Claude Code 연동 (경로 A)
│   ├── mcp.json                        #   Supabase MCP 서버 설정
│   └── commands/
│       └── hearim-daily.md             #   /hearim-daily 커스텀 커맨드
│
├── .github/
│   └── workflows/
│       └── generate-weekly.yml         # 위클리 자동 생성 (Phase 2, GitHub Actions Cron)
│
├── supabase/                           # DB 마이그레이션 (이동익 담당)
│   ├── config.toml                     #   Supabase 프로젝트 설정
│   └── migrations/
│       ├── 001_init.sql                #   테이블 생성 (profiles, dailies, weeklies 등)
│       ├── 002_indexes_fts.sql         #   인덱스 + Full-Text Search
│       ├── 003_rls.sql                 #   Row Level Security 정책
│       └── 004_triggers.sql            #   profiles 자동 생성 트리거
│
├── scripts/
│   └── generate-weekly.mjs             # 위클리 생성 스크립트 (Phase 2, GitHub Actions에서 실행)
│
├── src/                                # Next.js 프론트엔드 (한다혜 담당)
│   ├── app/
│   │   ├── layout.tsx                  #   루트 레이아웃 (폰트, 공통 UI)
│   │   ├── (public)/                   #   --- 공개 페이지 (인증 불필요) ---
│   │   │   ├── page.tsx                #   메인: 최근 데일리 + 최신 위클리
│   │   │   ├── daily/
│   │   │   │   ├── page.tsx            #   데일리 목록 (날짜별 정렬, 작성자 필터)
│   │   │   │   └── [id]/page.tsx       #   데일리 상세 (마크다운 렌더링)
│   │   │   ├── weekly/
│   │   │   │   ├── page.tsx            #   위클리 목록
│   │   │   │   └── [id]/page.tsx       #   위클리 상세
│   │   │   ├── search/page.tsx         #   검색 (PostgreSQL FTS)
│   │   │   └── login/page.tsx          #   로그인 (Magic Link)
│   │   ├── (protected)/                #   --- 보호 페이지 (인증 필요) ---
│   │   │   └── daily/
│   │   │       ├── new/page.tsx        #   AI 폼 작성 (경로 B: 키워드 → Gemini)
│   │   │       ├── write/page.tsx      #   직접 작성 (경로 C: 마크다운 에디터)
│   │   │       └── drafts/page.tsx     #   내 초안 (draft 목록, 수정, publish)
│   │   └── api/
│   │       ├── generate/route.ts       #   POST: Gemini로 데일리 마크다운 생성
│   │       └── keepalive/route.ts      #   GET: Supabase 일시중지 방지 핑
│   ├── components/
│   │   ├── ui/                         #   공통 UI (Button, Badge, Card 등)
│   │   ├── daily/                      #   데일리 관련 컴포넌트
│   │   ├── weekly/                     #   위클리 관련 컴포넌트
│   │   └── layout/                     #   Header, Footer 등
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts               #   브라우저용 createBrowserClient
│   │       ├── server.ts               #   서버 컴포넌트용 createServerClient
│   │       └── middleware.ts           #   세션 갱신용
│   └── types/
│       └── database.ts                 #   Supabase 자동 생성 타입 (supabase gen types)
│
├── middleware.ts                        # Next.js 미들웨어 (인증 리다이렉트)
├── .env.local                          # 환경 변수 (gitignore)
├── vercel.json                         # Vercel Cron 설정 (keepalive)
└── package.json
```

### 담당별 주요 작업 영역

| 영역 | 담당 | 설명 |
|---|---|---|
| `supabase/` | 이동익 | DB 스키마, RLS, 트리거, 마이그레이션 |
| `.claude/` | 이동익 | MCP 세팅, `/hearim-daily` 커맨드 |
| `scripts/` | 이동익 | 위클리 자동 생성 스크립트 |
| `.github/workflows/` | 이동익 | GitHub Actions Cron |
| `src/app/` | 한다혜 | 페이지 라우팅, UI |
| `src/components/` | 한다혜 | 공통/도메인 컴포넌트 |
| `src/lib/supabase/` | 한다혜 | Supabase 클라이언트 연동 |
| `src/app/api/` | 공동 | generate(이동익 로직 + 한다혜 연결), keepalive |
| `middleware.ts` | 한다혜 | 인증 미들웨어 |
| Vercel 배포 | 한다혜 | 도메인, 환경 변수, Cron |
