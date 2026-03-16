# 헤아림 Claude Code 스킬 사용법

> **설치 (터미널에서 한 줄 실행):**
> ```bash
> curl -sL https://raw.githubusercontent.com/musinsa-dongik/hearim/main/scripts/install-skills.sh | bash
> ```

## 스킬 목록

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| 데일리/위클리 작성 | `/hearim [daily\|weekly]` | 학습 기록을 md 파일로 생성 |
| DB 저장 | `/hearim-push [YYYY-MM-DD]` | md 파일을 Supabase DB에 draft로 저장 |

> 스킬 파일은 `~/.claude/skills/`(글로벌)에 설치됩니다.

## 설치 후 필수 설정

### 1. Supabase anon key 입력

`~/.zshrc`에 추가된 `HEARIM_ANON_KEY`를 실제 키로 교체합니다.
(Supabase 대시보드 → Settings → API → anon key)

```bash
# ~/.zshrc 에서 이 부분을 찾아 수정
export HEARIM_SUPABASE_URL="https://your-project.supabase.co"
export HEARIM_ANON_KEY="여기에_anon_key_입력"
```

수정 후:
```bash
source ~/.zshrc
```

### 2. CLI 인증 (최초 1회)

`/hearim-push`를 처음 실행하면 세션 토큰을 요청합니다:

1. https://hearim.vercel.app/cli/auth 에 접속 (GitHub 로그인 필요)
2. 표시된 토큰을 복사
3. 터미널에 붙여넣기

토큰은 `~/.hearim-session`에 저장되어 이후 자동으로 사용됩니다.

## 선택 설정

### 레포 경로 추가 (Tier 2)

`~/.hearim-config`에 커밋을 수집할 프로젝트 경로를 추가합니다:

```bash
# ~/.hearim-config
HEARIM_REPOS=(
  "$HOME/path/to/project-a"
  "$HOME/path/to/project-b"
)
```

설정 안 하면 `~/Documents` 하위 git 레포를 자동 탐색합니다 (Tier 1).

## 사용 흐름

```
1. Claude Code에서 /hearim 실행
   → 오늘의 학습 기록을 md 파일로 생성
   → ~/ai-workspace/hearim/daily/YYYY-MM-DD.md 저장

2. 내용 확인 후 /hearim-push 실행
   → md 파일을 Supabase DB에 draft로 INSERT

3. 사이트에서 확인 후 "확정" 버튼 클릭
   → https://hearim.vercel.app/daily/drafts
```

## Tier 시스템

**MEMORY.md, 이전 헤아림은 Tier와 무관하게 항상 수집합니다.**

| Tier | 조건 | 추가 수집 |
|------|------|----------|
| 1 | 설정 없음 | ~/Documents 자동 탐색 + 현재 레포 Git 커밋 |
| 2 | `~/.hearim-config` 있음 | + 멀티레포 Git 커밋 |
| 3 | config + MCP 도구 | + Jira + Claude-Mem |

## 명령어 상세

### /hearim [daily|weekly] [YYYY-MM-DD]

오늘 작업한 내용을 기반으로 학습 기록을 자동 생성합니다.

**모드:**
- `daily` (기본): 데일리 학습 기록
- `weekly`: 스터디 발표 기록

**수집하는 데이터 (Tier에 따라):**
- Git 커밋 (현재 레포 + `.hearim-config`에 정의된 레포들)
- MEMORY.md (Claude Code auto memory)
- 이전 헤아림 데일리 (학습 연속성)
- Jira 티켓 (Tier 3)
- Claude-Mem (Tier 3)

**생성되는 문서 구조:**
- 오늘의 작업 (Context) -- Jira 티켓 번호 포함 (있는 경우)
- 배움 카드 (Concepts) -- 2~4개, 판단 기준/반례 포함
- 이전 학습 질의 연결
- 추가 학습 질의
- 튜터의 한마디

### /hearim-push [YYYY-MM-DD]

생성된 md 파일을 Supabase `dailies` 테이블에 저장합니다.

- 같은 날짜에 이미 데일리가 있으면 UPDATE 여부를 물어봅니다.
- 저장 후 확인 URL과 데일리 ID를 알려줍니다.
