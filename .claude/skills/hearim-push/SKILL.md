---
name: hearim-push
description: "헤아림 데일리 md 파일을 Supabase DB에 저장 (INSERT/UPDATE). 'DB 저장', 'push' 키워드에 반응"
argument-hint: "[YYYY-MM-DD]"
disable-model-invocation: true
allowed-tools: Bash(curl *), Bash(git *), Bash(cat *), Read, Write, Glob
---

# 헤아림 데일리 DB 저장

`/hearim`으로 생성한 md 파일을 Supabase dailies 테이블에 저장한다.

## Step 1. 대상 파일 확인

인자가 없으면 오늘 날짜의 파일을 사용한다:
```
~/ai-workspace/hearim/daily/YYYY-MM-DD.md
```

인자로 날짜가 주어지면 해당 날짜 파일을 사용한다:
```
/hearim-push 2026-03-09
```

파일이 없으면 사용자에게 알리고 `/hearim`을 먼저 실행하라고 안내한다.

## Step 2. 인증 확인

### 환경 변수
셸 환경 변수 `HEARIM_SUPABASE_URL`과 `HEARIM_ANON_KEY`를 사용한다.

설정되지 않았으면 사용자에게 안내한다:
```
환경 변수가 설정되지 않았습니다.
~/.zshrc에 아래를 추가하세요:
  export HEARIM_SUPABASE_URL="https://your-project.supabase.co"
  export HEARIM_ANON_KEY="your-anon-key"
```

### 세션 토큰
`~/.hearim-session` 파일에서 세션 토큰을 읽는다.

```bash
if [ -f "$HOME/.hearim-session" ]; then
  SESSION=$(cat "$HOME/.hearim-session")
  ACCESS_TOKEN=$(echo "$SESSION" | base64 -d 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$SESSION" | base64 -d 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])" 2>/dev/null)
fi
```

토큰이 없으면 사용자에게 안내한다:
```
세션 토큰이 없습니다. 아래 단계를 따라주세요:

1. https://hearim.vercel.app/cli/auth 에 접속 (로그인 필요)
2. 표시된 토큰을 복사
3. 아래에 붙여넣기
```

사용자가 토큰을 입력하면 `~/.hearim-session`에 저장한다:
```bash
echo "<입력받은_토큰>" > "$HOME/.hearim-session"
chmod 600 "$HOME/.hearim-session"
```

### 토큰 갱신
access_token이 만료된 경우(API 응답 401), refresh_token으로 갱신한다:
```bash
curl -sf "${HEARIM_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token" \
  -H "apikey: ${HEARIM_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"${REFRESH_TOKEN}\"}"
```

갱신 성공 시 새 토큰으로 `~/.hearim-session`을 업데이트한다.
갱신 실패 시 사용자에게 다시 로그인하라고 안내한다.

## Step 3. author_id 조회

세션 토큰에서 사용자 정보를 가져온다:
```bash
curl -sf "${HEARIM_SUPABASE_URL}/auth/v1/user" \
  -H "apikey: ${HEARIM_ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

응답의 `id` 필드가 author_id이다.

## Step 4. 중복 확인

같은 날짜에 이미 데일리가 있는지 확인한다:
```bash
curl -sf "${HEARIM_SUPABASE_URL}/rest/v1/dailies?date=eq.YYYY-MM-DD&author_id=eq.<author_id>&select=id,title" \
  -H "apikey: ${HEARIM_ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
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
  -H "apikey: ${HEARIM_ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
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
- 확인 URL: `https://hearim.vercel.app/daily/<id>`
- "초안(draft)으로 저장됨. 사이트에서 확인 후 확정하세요."

## 주의사항

- 민감한 정보(API 키, 비밀번호, 토큰 등)가 출력에 노출되지 않도록 한다
- curl 실행 시 환경 변수나 토큰을 echo하거나 출력하지 않는다
- `~/.hearim-session` 파일은 chmod 600으로 보호한다
- `HEARIM_SUPABASE_URL`과 `HEARIM_ANON_KEY` 환경 변수를 사용한다
