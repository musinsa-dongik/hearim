---
name: hearim
description: "헤아림 학습 기록 생성. 오늘 한 일에서 학습 포인트를 추출하고 배움 카드를 작성한다. 'hearim', '헤아림', '데일리 학습', '위클리 스터디' 키워드에 반응"
argument-hint: "[daily|weekly] [YYYY-MM-DD]"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(bash *), Bash(source *), Read, Write, Edit, Glob, Grep
---

# 헤아림 (He-a-rim)

"내가 안다고 생각한 것을, 말로 헤아려보는 시간"

## 환경 감지

!`bash ${CLAUDE_SKILL_DIR}/scripts/detect-env.sh`

## 실행 모드

$ARGUMENTS[0]에 따라 모드를 결정한다:
- `weekly` 또는 `위클리` → **위클리 모드**
- 그 외 (빈 값 포함) → **데일리 모드** (기본)
- $ARGUMENTS[1]이 날짜(YYYY-MM-DD)이면 해당 날짜로 실행 (기본: 오늘)

## Tier 판정

환경 감지 결과로 Tier를 결정한다:

| 조건 | Tier | 추가 수집 |
|------|------|----------|
| config 없음 (NO_CONFIG) | **Tier 1** | 현재 레포 커밋 |
| config 있음, MCP 도구 없음 | **Tier 2** | + 멀티레포 커밋 |
| config 있음, MCP 도구 있음 | **Tier 3** | + Jira + Claude-Mem |

> **MEMORY.md, 이전 헤아림은 Tier와 무관하게 항상 수집한다.**
> Tier 판정 후 [collectors.md](collectors.md)에서 해당 Tier의 수집 범위를 확인한다.

---

## 데일리 모드

### Step 1. 컨텍스트 수집 (병렬 실행)

[collectors.md](collectors.md)를 참조하여 해당 Tier의 데이터 소스를 **모두 빠짐없이** 동시에 조회한다.

**핵심 원칙:**
- 가용한 소스는 모두 수집한다. 하나라도 누락하면 학습 맥락이 불완전해진다.
- MCP 도구 호출 실패 시 로그 남기고 건너뛴다 (에러로 중단하지 않는다).
- Fallback 전략을 반드시 따른다 (커밋 0건 시 최근 5개 조회 등).

### Step 2. 학습 포인트 추출

수집한 데이터에서 **배움 카드로 만들 주제**를 식별한다:

1. **Git 커밋 분석**: 커밋 메시지와 변경 파일에서 **기술적 판단(왜 이렇게 했는가)**을 추출
2. **판단 기준 추출**: "대안은 무엇이었고, 왜 이 방법을 택했는가", "이 방법이 맞지 않는 경우는?"
3. **MEMORY.md 분석** (모든 Tier): 설계 결정사항, 코드 리뷰 피드백에서 학습 포인트 추출
4. **Jira ↔ Git 매칭** (Tier 3): 티켓 맥락과 커밋 연결
5. **이전 헤아림 연결**: 이전 "추가 학습 질의"에 대한 답을 오늘 찾았는지 확인
6. **반복 패턴 식별**: 여러 소스에서 반복 등장하는 주제 = 핵심 학습 포인트

### Step 3. 데일리 작성

출력 경로: `~/ai-workspace/hearim/daily/YYYY-MM-DD.md`

**[templates/daily.md](templates/daily.md)** 템플릿을 따라 작성한다.

핵심 원칙:
- **Context -> Concepts** 순서: 먼저 이슈+해결을 쓰고, 거기서 개념을 추출
- **커밋 추적성**: 각 작업 항목에 커밋 해시와 변경량(+N/-M줄) 포함
- **나의 경험 중심**: "오늘 내가 왜 이렇게 판단했는가"를 기록
- **판단 기준과 반례**: 대안과 그것을 택하지 않은 이유, 맞지 않는 경우도 서술
- **코드 예시는 실제 구현 기반**: Before/After 비교
- **이전 학습 연결**: 이전 헤아림의 "추가 학습 질의"와 연결
- **MEMORY.md 활용** (모든 Tier): 설계 결정, PR 리뷰 피드백을 배움 카드 소재로 활용

### Step 4. 학습 연결

이전 헤아림이 존재하면 반드시 실행 (Tier 무관):
- 이전 "추가 학습 질의"를 하나씩 확인, 오늘 작업/배움과 연결
- 반복 테마나 지식 갭 식별
- 성장 궤적 확인 (이전에 "헷갈린다"고 했던 것이 오늘 해결되었는지)
- 연결 내용은 데일리의 **"이전 학습 질의 연결"** 섹션에 작성

### Step 5. 완료 보고

사용자에게 알린다:
- 저장된 파일 경로
- "DB 저장은 `/hearim-push`로 별도 실행하세요."

---

## 위클리 모드

### Step 1. 컨텍스트 수집

사용자에게 발표 내용을 물어보거나, 제공된 내용을 정리한다:
- 발표자, 주제, 핵심 내용
- 설명이 막혔던 부분
- 도움된 질문들

### Step 2. 위클리 작성

출력 경로: `~/ai-workspace/hearim/weekly/YYYY-WXX.md` (ISO 주차)

**[templates/weekly.md](templates/weekly.md)** 템플릿을 따라 작성한다.

---

## 튜터 페르소나

모든 작성 시 **[tutor-persona.md](tutor-persona.md)**의 태도를 따른다.

## 주의사항

- 민감한 정보(API 키, 비밀번호, 내부 URL 등)는 제외한다
- content에 이모지를 쓰지 않는다 (섹션 제목 포함)
- 헤아림 스터디 발표 자료로 활용할 수 있도록 "설명하듯이" 정리한다
