# 헤아림 Claude Code 스킬 사용법

## 스킬 목록

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| 데일리 작성 | `/hearim-daily` | 오늘의 학습 기록을 md 파일로 생성 |
| DB 저장 | `/hearim-push` | md 파일을 Supabase DB에 draft로 저장 |

## 사전 준비

### 1. hearim 레포 클론

```bash
git clone https://github.com/musinsa-dongik/hearim.git ~/hearim
```

### 2. 환경 변수 설정

`~/hearim/.env.local` 파일에 Supabase 키가 필요합니다 (팀원에게 전달받으세요):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx
```

### 3. 사용자별 레포 설정 (선택)

`~/.hearim-config` 파일을 만들면 `/hearim-daily` 실행 시 여러 프로젝트의 커밋을 자동 수집합니다.

```bash
# ~/.hearim-config
HEARIM_REPOS=(
  "$HOME/Documents/GitHub/global-musinsa-frontend"
  "$HOME/Documents/GitHub/mss-frontend"
  "$HOME/hearim"
)
```

설정 파일이 없으면 현재 레포의 커밋만 수집합니다.

### 4. Supabase 프로필 등록

DB 저장(`/hearim-push`) 시 git 이메일로 author_id를 조회합니다.
Supabase `profiles` 테이블에 본인의 이메일이 등록되어 있어야 합니다.

## 사용 흐름

```
1. Claude Code에서 /hearim-daily 실행
   → 오늘의 학습 기록을 md 파일로 생성
   → ~/ai-workspace/hearim/daily/YYYY-MM-DD.md 저장

2. 내용 확인 후 /hearim-push 실행
   → md 파일을 Supabase DB에 draft로 INSERT

3. 사이트에서 확인 후 "확정" 버튼 클릭
   → http://localhost:3000/daily/drafts
```

## 명령어 상세

### /hearim-daily

오늘 Claude Code로 작업한 내용을 기반으로 학습 기록을 자동 생성합니다.

**수집하는 데이터:**
- Git 커밋 (현재 레포 + `.hearim-config`에 정의된 레포들)
- MEMORY.md (Claude Code auto memory)
- 이전 헤아림 데일리 (학습 연속성)

**생성되는 문서 구조:**
- 오늘의 작업 (Context) — 이슈/원인/해결
- 배움 카드 (Concepts) — 2~4개, 각 3-5문장
- 추가 학습 질의
- 튜터의 한마디

### /hearim-push

생성된 md 파일을 Supabase `dailies` 테이블에 저장합니다.

```bash
# 오늘 날짜 파일 저장
/hearim-push

# 특정 날짜 파일 저장
/hearim-push 2026-03-09
```

- 같은 날짜에 이미 데일리가 있으면 UPDATE 여부를 물어봅니다.
- 저장 후 확인 URL과 데일리 ID를 알려줍니다.
