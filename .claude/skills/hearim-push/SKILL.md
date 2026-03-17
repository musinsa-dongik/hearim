---
name: hearim-push
description: "헤아림 데일리 md 파일을 Supabase DB에 저장 (INSERT/UPDATE). 'DB 저장', 'push' 키워드에 반응"
argument-hint: "[YYYY-MM-DD]"
disable-model-invocation: true
allowed-tools: Bash(python3 *), Bash(source *), Read, Write, Glob
---

# 헤아림 데일리 DB 저장

`/hearim`으로 생성한 md 파일을 Supabase dailies 테이블에 저장한다.

## 실행

아래 스크립트를 **한 번의 bash 호출**로 실행한다:

```bash
source ~/.zshrc 2>/dev/null
python3 ~/.claude/skills/hearim-push/scripts/push.py $ARGUMENTS
```

## 결과 처리

스크립트 출력에 따라 사용자에게 알린다:

### `SUCCESS:<id>`
- 저장 완료. 사용자에게 알린다:
  - 확인 URL: `https://hearim.vercel.app/daily/<id>`
  - "초안(draft)으로 저장됨. 사이트에서 확인 후 확정하세요."

### `DUPLICATE:<id>`
- 같은 날짜에 이미 데일리가 존재한다. 사용자에게 **UPDATE** 할지 물어본다.
- UPDATE하려면:
```bash
source ~/.zshrc 2>/dev/null
python3 -c "
import sys, os, re, json, base64, urllib.request, urllib.error

SUPABASE_URL = os.environ['HEARIM_SUPABASE_URL']
ANON_KEY = os.environ['HEARIM_ANON_KEY']
SESSION_FILE = os.path.expanduser('~/.hearim-session')
DAILY_ID = '<중복된 id>'
TARGET_DATE = '<날짜>'

# 세션 로드 + refresh
with open(SESSION_FILE) as f:
    raw = f.read().strip()
data = json.loads(base64.b64decode(raw))
refresh_token = data['refresh_token']

req = urllib.request.Request(
    f'{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token',
    method='POST',
    headers={'apikey': ANON_KEY, 'Content-Type': 'application/json'},
    data=json.dumps({'refresh_token': refresh_token}).encode()
)
with urllib.request.urlopen(req) as resp:
    tokens = json.loads(resp.read())
access_token = tokens['access_token']

# 새 세션 저장
new_data = json.dumps({'access_token': access_token, 'refresh_token': tokens['refresh_token']})
with open(SESSION_FILE, 'w') as f:
    f.write(base64.b64encode(new_data.encode()).decode())
os.chmod(SESSION_FILE, 0o600)

# author_id
req2 = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/user', headers={'apikey': ANON_KEY, 'Authorization': f'Bearer {access_token}'})
with urllib.request.urlopen(req2) as resp:
    author_id = json.loads(resp.read())['id']

# 파일 읽기
file_path = os.path.expanduser(f'~/ai-workspace/hearim/daily/{TARGET_DATE}.md')
with open(file_path) as f:
    content = f.read()
match = re.search(r'### 튜터의 한마디\n\n(.+?)$', content, re.DOTALL)
summary = match.group(1).strip() if match else ''

# PATCH
url = f'{SUPABASE_URL}/rest/v1/dailies?id=eq.{DAILY_ID}&author_id=eq.{author_id}'
req3 = urllib.request.Request(url, method='PATCH', headers={
    'apikey': ANON_KEY, 'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json', 'Prefer': 'return=representation'
}, data=json.dumps({'content': content, 'summary': summary, 'status': 'draft'}).encode())
with urllib.request.urlopen(req3) as resp:
    result = json.loads(resp.read())
    if isinstance(result, list) and result:
        print(f'UPDATE 완료: {result[0][\"id\"]}')
    else:
        print(f'UPDATE 실패: {result}')
"
```

### `ERROR:*`
- 에러 메시지를 사용자에게 표시한다.
- 토큰 관련 에러면 `https://hearim.vercel.app/cli/auth`에서 재발급 안내.

## 주의사항

- 민감한 정보(API 키, 비밀번호, 토큰 등)가 출력에 노출되지 않도록 한다
- `~/.hearim-session` 파일은 chmod 600으로 보호한다
- 모든 인증/갱신/저장이 **하나의 python 프로세스**에서 처리되므로 토큰 갱신 문제가 발생하지 않는다
