#!/usr/bin/env python3
"""hearim-push: 데일리 md 파일을 Supabase DB에 저장"""

import sys
import os
import re
import json
import base64
import urllib.request
import urllib.error
from datetime import date

# === Config ===
SUPABASE_URL = os.environ.get("HEARIM_SUPABASE_URL", "")
ANON_KEY = os.environ.get("HEARIM_ANON_KEY", "")
SESSION_FILE = os.path.expanduser("~/.hearim-session")
DAILY_DIR = os.path.expanduser("~/ai-workspace/hearim/daily")
SITE_URL = "https://hearim.vercel.app"


def api_request(method, url, headers=None, data=None):
    """HTTP 요청 헬퍼"""
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"error": body}


def load_session():
    """세션 파일에서 토큰 로드"""
    if not os.path.exists(SESSION_FILE):
        return None, None
    with open(SESSION_FILE, "r") as f:
        raw = f.read().strip()
    try:
        decoded = base64.b64decode(raw).decode("utf-8")
        data = json.loads(decoded)
        return data.get("access_token"), data.get("refresh_token")
    except Exception:
        return None, None


def save_session(access_token, refresh_token):
    """세션 파일에 토큰 저장"""
    data = json.dumps({"access_token": access_token, "refresh_token": refresh_token})
    encoded = base64.b64encode(data.encode("utf-8")).decode("utf-8")
    with open(SESSION_FILE, "w") as f:
        f.write(encoded)
    os.chmod(SESSION_FILE, 0o600)


def refresh_access_token(refresh_token):
    """refresh_token으로 새 access_token 발급"""
    status, body = api_request(
        "POST",
        f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
        headers={
            "apikey": ANON_KEY,
            "Content-Type": "application/json",
        },
        data={"refresh_token": refresh_token},
    )
    if status == 200 and "access_token" in body:
        new_access = body["access_token"]
        new_refresh = body["refresh_token"]
        save_session(new_access, new_refresh)
        return new_access
    return None


def get_auth_headers(access_token):
    return {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def get_user(access_token):
    """인증된 유저 정보 조회"""
    status, body = api_request(
        "GET",
        f"{SUPABASE_URL}/auth/v1/user",
        headers=get_auth_headers(access_token),
    )
    if status == 200:
        return body.get("id")
    return None


def check_duplicate(access_token, target_date, author_id):
    """같은 날짜에 이미 데일리가 있는지 확인"""
    url = (
        f"{SUPABASE_URL}/rest/v1/dailies"
        f"?date=eq.{target_date}&author_id=eq.{author_id}&select=id,title"
    )
    status, body = api_request("GET", url, headers=get_auth_headers(access_token))
    if status == 200 and isinstance(body, list) and len(body) > 0:
        return body[0]["id"]
    return None


def insert_daily(access_token, author_id, target_date, content, summary):
    """데일리 INSERT"""
    headers = get_auth_headers(access_token)
    headers["Prefer"] = "return=representation"
    status, body = api_request(
        "POST",
        f"{SUPABASE_URL}/rest/v1/dailies",
        headers=headers,
        data={
            "author_id": author_id,
            "title": f"헤아림 데일리: {target_date}",
            "date": target_date,
            "content": content,
            "summary": summary,
            "status": "draft",
        },
    )
    if status == 201 and isinstance(body, list) and len(body) > 0:
        return body[0]
    return {"error": body, "status": status}


def update_daily(access_token, daily_id, author_id, content, summary):
    """데일리 UPDATE"""
    headers = get_auth_headers(access_token)
    headers["Prefer"] = "return=representation"
    url = f"{SUPABASE_URL}/rest/v1/dailies?id=eq.{daily_id}&author_id=eq.{author_id}"
    status, body = api_request(
        "PATCH",
        url,
        headers=headers,
        data={
            "content": content,
            "summary": summary,
            "status": "draft",
        },
    )
    if status == 200 and isinstance(body, list) and len(body) > 0:
        return body[0]
    return {"error": body, "status": status}


def extract_summary(content):
    """'튜터의 한마디' 섹션 추출"""
    match = re.search(r"### 튜터의 한마디\n\n(.+?)$", content, re.DOTALL)
    return match.group(1).strip() if match else ""


def main():
    # 1. 환경 변수 확인
    if not SUPABASE_URL or not ANON_KEY:
        print("ERROR: HEARIM_SUPABASE_URL 또는 HEARIM_ANON_KEY 환경 변수가 없습니다.")
        print("~/.zshrc에 추가하세요.")
        sys.exit(1)

    # 2. 날짜 결정
    target_date = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()

    # 3. 파일 확인
    file_path = os.path.join(DAILY_DIR, f"{target_date}.md")
    if not os.path.exists(file_path):
        print(f"ERROR: 파일이 없습니다: {file_path}")
        print("/hearim을 먼저 실행하세요.")
        sys.exit(1)

    with open(file_path, "r") as f:
        content = f.read()
    summary = extract_summary(content)

    # 4. 세션 로드
    access_token, refresh_token = load_session()
    if not access_token or not refresh_token:
        print("ERROR: 세션 토큰이 없습니다.")
        print("https://hearim.vercel.app/cli/auth 에서 토큰을 발급받으세요.")
        sys.exit(1)

    # 5. 인증 (access_token 시도 → 실패 시 refresh)
    author_id = get_user(access_token)
    if not author_id:
        print("토큰 갱신 중...")
        access_token = refresh_access_token(refresh_token)
        if not access_token:
            print("ERROR: 토큰 갱신 실패. 다시 로그인하세요.")
            print("https://hearim.vercel.app/cli/auth")
            sys.exit(1)
        author_id = get_user(access_token)
        if not author_id:
            print("ERROR: 인증 실패.")
            sys.exit(1)

    # 6. 중복 확인
    existing_id = check_duplicate(access_token, target_date, author_id)
    if existing_id:
        print(f"DUPLICATE:{existing_id}")
        sys.exit(0)

    # 7. INSERT
    result = insert_daily(access_token, author_id, target_date, content, summary)
    if "error" in result:
        print(f"ERROR: INSERT 실패 - {result}")
        sys.exit(1)

    daily_id = result.get("id", "?")
    print(f"SUCCESS:{daily_id}")


if __name__ == "__main__":
    main()
