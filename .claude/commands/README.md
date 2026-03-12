# 헤아림 Claude Code 스킬 사용법

## 스킬 목록

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| 데일리 작성 | `/hearim-daily` | 오늘의 학습 기록을 md 파일로 생성 |
| DB 저장 | `/hearim-push` | md 파일을 Supabase DB에 draft로 저장 |

## 원클릭 설치

레포 클론 없이 아래 한 줄로 설치합니다:

```bash
curl -sL https://raw.githubusercontent.com/musinsa-dongik/hearim/main/scripts/install-skills.sh | bash
```

설치되는 것:
- `~/.claude/commands/hearim-daily.md` — 데일리 작성 스킬
- `~/.claude/commands/hearim-push.md` — DB 저장 스킬
- `~/.hearim-config` — 레포 경로 설정 (템플릿)
- `~/.zshrc`에 환경 변수 추가 — Supabase 접속 정보

## 설치 후 필수 설정

### 1. Supabase 키 입력

`~/.zshrc`에 추가된 `HEARIM_SERVICE_ROLE_KEY`를 실제 키로 교체합니다.
(팀 리드에게 DM으로 전달받으세요)

```bash
# ~/.zshrc 에서 이 부분을 찾아 수정
export HEARIM_SERVICE_ROLE_KEY="여기에_서비스_롤_키_입력"
```

수정 후:
```bash
source ~/.zshrc
```

### 2. Supabase 프로필 등록

`/hearim-push` 실행 시 git 이메일로 author_id를 조회합니다.
Supabase `profiles` 테이블에 본인의 이메일이 등록되어 있어야 합니다.
(GitHub 로그인 시 자동 생성됨)

## 선택 설정

### 레포 경로 추가

`~/.hearim-config`에 커밋을 수집할 프로젝트 경로를 추가합니다:

```bash
# ~/.hearim-config
HEARIM_REPOS=(
  "$HOME/Documents/GitHub/global-musinsa-frontend"
  "$HOME/Documents/GitHub/mss-frontend"
)
```

설정 안 하면 현재 레포의 커밋만 수집합니다.

## 사용 흐름

```
1. Claude Code에서 /hearim-daily 실행
   → 오늘의 학습 기록을 md 파일로 생성
   → ~/ai-workspace/hearim/daily/YYYY-MM-DD.md 저장

2. 내용 확인 후 /hearim-push 실행
   → md 파일을 Supabase DB에 draft로 INSERT

3. 사이트에서 확인 후 "확정" 버튼 클릭
   → https://hearim.vercel.app/daily/drafts
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
