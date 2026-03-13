# 헤아림 데이터 수집 가이드

SKILL.md의 수집 단계에서 이 문서를 참조한다.

---

## 설정 파일

`~/.hearim-config`에 사용자별 설정을 둔다.

```bash
# ~/.hearim-config 예시
HEARIM_REPOS=(
  "$HOME/path/to/project-a"
  "$HOME/path/to/project-b"
)
```

### config가 없을 때

config가 없으면 **프로젝트 루트의 `~/Documents` 디렉토리**에서 git 레포를 자동 탐색한다:

```bash
GIT_EMAIL=$(git config user.email)
# ~/Documents 하위 1단계 디렉토리에서 git 레포 탐색
for dir in ~/Documents/*/; do
  if [ -d "$dir/.git" ]; then
    COMMITS=$(git -C "$dir" log --since="<date> 00:00" --until="<date+1> 00:00" --author="$GIT_EMAIL" --all --oneline 2>/dev/null | wc -l)
    if [ "$COMMITS" -gt 0 ]; then
      echo "=== $(basename $dir) ==="
      git -C "$dir" log --since="<date> 00:00" --until="<date+1> 00:00" --author="$GIT_EMAIL" --all --format="%s (%ai)" 2>/dev/null
    fi
  fi
done
```

> `~/Documents` 하위에 git 레포가 없거나 커밋이 0건이면 현재 레포만 사용한다.

### config 설정 안내

최초 실행 시(config 파일이 없을 때) 자동 탐색 완료 후, 사용자에게 안내한다:

```
현재 ~/Documents 하위의 git 레포를 자동 탐색했습니다.
특정 레포만 지정하려면 ~/.hearim-config를 생성하세요:

  echo 'HEARIM_REPOS=(
    "$HOME/path/to/project-a"
    "$HOME/path/to/project-b"
  )' > ~/.hearim-config

설정하면 지정된 레포만 수집합니다 (Tier 2).
지금은 자동 탐색 결과로 계속 진행합니다.
```

이 안내는 **매 실행마다 반복하지 않는다** — config가 없을 때 첫 실행에서만 표시한다.

---

## 1. Git 커밋

**모든 Tier에서 실행한다.**

### 현재 레포
```bash
GIT_EMAIL=$(git config user.email)
git log --since="<date> 00:00" --until="<date+1> 00:00" --author="$GIT_EMAIL" --all --format="%s (%ai)"
```

### config 있을 때: 지정된 레포 순회
```bash
GIT_EMAIL=$(git config user.email)
if [ -f ~/.hearim-config ]; then
  source ~/.hearim-config
  for repo in "${HEARIM_REPOS[@]}"; do
    echo "=== $(basename $repo) ==="
    git -C "$repo" log --since="<date> 00:00" --until="<date+1> 00:00" --author="$GIT_EMAIL" --all --format="%s (%ai)" 2>/dev/null
  done
fi
```

### config 없을 때: ~/Documents 자동 탐색

위 "config가 없을 때" 섹션의 스크립트를 실행한다.

### Fallback (모든 Tier)
모든 레포에서 커밋이 0개일 때, 현재 레포의 최근 5개 커밋을 조회한다:
```bash
git log --author="$GIT_EMAIL" --all --format="%s (%ai)" -5
```

---

## 2. MEMORY.md

**모든 Tier에서 실행한다.** MEMORY.md에는 다른 프로젝트의 작업 맥락과 설계 결정이 담겨 있으므로, config가 없어도 반드시 수집한다.

### 경로 A: 현재 프로젝트 루트
```
Glob: .claude/MEMORY.md 또는 CLAUDE.md
```

### 경로 B: Auto Memory 디렉토리
```
Glob: ~/.claude/projects/**/memory/MEMORY.md
```
발견된 파일 중 **최근 수정된 상위 5개**를 읽어 학습 맥락을 파악한다.

> 파일이 없으면 에러를 무시하고 다음 경로로 넘어간다.

---

## 3. Claude-Mem (Chroma DB)

**Tier 3에서만 실행한다.** (MCP 도구 `chroma_query_documents` 가용 시)

```
chroma_query_documents(
  collection_name: "claude_memories",
  query_texts: ["<project-name> <date> 작업 개발 학습"],
  n_results: 5
)
```

MCP 도구가 없거나 호출 실패 시 "Claude-Mem: 미설정" 로그 후 건너뛴다.

---

## 4. Jira 티켓

**Tier 3에서만 실행한다.** (MCP 도구 가용 시)

### 기본 조회: 오늘 업데이트된 티켓
```
searchJiraIssuesUsingJql(
  jql: "assignee = currentUser() AND updated >= -1d",
  fields: ["summary", "status", "priority", "updated"]
)
```

### Fallback: 결과가 0건일 때
```
searchJiraIssuesUsingJql(
  jql: "assignee = currentUser() AND status != Done ORDER BY updated DESC",
  fields: ["summary", "status", "priority", "updated"],
  maxResults: 10
)
```

MCP 도구가 없으면 "Jira: 미설정" 로그 후 건너뛴다.

---

## 5. 이전 헤아림 데일리

**모든 Tier에서 실행한다.**

```
Glob: ~/ai-workspace/hearim/daily/*.md → 최신 파일 읽기
```

이전 엔트리의 **추가 학습 질의**와 **배움 카드 주제**를 확인하여 오늘의 학습과 연결한다.

---

## 수집 체크리스트

작성 전 아래 항목의 수집 여부를 확인한다.

### 모든 Tier (필수)
- [ ] Git 커밋: 현재 레포 + (config 있으면 지정 레포, 없으면 ~/Documents 자동 탐색)
- [ ] MEMORY.md: 경로 A + B
- [ ] 이전 헤아림 데일리

### Tier 3 추가 (MCP 도구 가용 시)
- [ ] Claude-Mem: Chroma DB 시맨틱 검색
- [ ] Jira: 오늘 업데이트 티켓
