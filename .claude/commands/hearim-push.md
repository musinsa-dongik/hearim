---
description: "헤아림 데일리 md 파일을 Supabase DB에 저장 (INSERT/UPDATE)"
allowed-tools: Bash(curl:*), Read, Glob
---

# /hearim-push - 헤아림 데일리 DB 저장

`/hearim-daily`로 생성한 md 파일을 Supabase dailies 테이블에 저장한다.

## Step 1. 대상 파일 확인

인자가 없으면 오늘 날짜의 파일을 사용한다:
```
~/ai-workspace/hearim/daily/YYYY-MM-DD.md
```

인자로 날짜가 주어지면 해당 날짜 파일을 사용한다:
```
/hearim-push 2026-03-09
```

파일이 없으면 사용자에게 알리고 `/hearim-daily`를 먼저 실행하라고 안내한다.

## Step 2. 환경 변수 확인

셸 환경 변수 `HEARIM_SUPABASE_URL`과 `HEARIM_SERVICE_ROLE_KEY`를 사용한다.
(설치 스크립트가 `~/.zshrc`에 추가함)

설정되지 않았으면 사용자에게 안내한다:
```
환경 변수가 설정되지 않았습니다.
scripts/install-skills.sh를 실행하거나 ~/.zshrc에 직접 추가하세요.
```

## Step 3. author_id 조회

git 이메일을 동적으로 가져와서 프로필을 조회한다:
```bash
GIT_EMAIL=$(git config user.email)
curl -sf "${HEARIM_SUPABASE_URL}/rest/v1/profiles?email=eq.${GIT_EMAIL}&select=id" \
  -H "apikey: ${HEARIM_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${HEARIM_SERVICE_ROLE_KEY}"
```

조회 결과가 없으면 사용자에게 author_id를 직접 물어본다.

## Step 4. 중복 확인

같은 날짜에 이미 데일리가 있는지 확인한다:
```bash
curl -sf "${HEARIM_SUPABASE_URL}/rest/v1/dailies?date=eq.YYYY-MM-DD&author_id=eq.<author_id>&select=id,title" \
  -H "apikey: ${HEARIM_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${HEARIM_SERVICE_ROLE_KEY}"
```

- 이미 존재하면 사용자에게 알리고 **UPDATE** 할지 물어본다.
- UPDATE 시 PATCH 요청 사용.

## Step 5. INSERT 실행

md 파일의 내용을 읽어서 INSERT한다.

### content 파싱

- 파일 전체 내용을 `content` 필드에 넣는다.
- "튜터의 한마디" 섹션의 내용을 `summary` 필드로 추출한다.

### INSERT

```bash
curl -sf "${HEARIM_SUPABASE_URL}/rest/v1/dailies" \
  -H "apikey: ${HEARIM_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${HEARIM_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "author_id": "<author_id>",
    "title": "헤아림 데일리: YYYY-MM-DD",
    "date": "YYYY-MM-DD",
    "content": "<md 파일 전체 내용>",
    "summary": "<튜터의 한마디 내용>",
    "status": "draft"
  }'
```

### title 규칙

`헤아림 데일리: YYYY-MM-DD` 형식으로 자동 생성한다.

## Step 6. 완료 보고

INSERT 성공 후 사용자에게 알린다:
- 저장된 데일리 ID
- 확인 URL: `http://localhost:3000/daily/<id>`
- "초안(draft)으로 저장됨. 사이트에서 확인 후 확정하세요."

## 주의사항
- 민감한 정보(API 키, 비밀번호 등)가 출력에 노출되지 않도록 한다
- curl 실행 시 환경 변수를 echo하거나 출력하지 않는다
- `HEARIM_SUPABASE_URL`과 `HEARIM_SERVICE_ROLE_KEY` 환경 변수를 사용한다 (~/.zshrc에 설정)
