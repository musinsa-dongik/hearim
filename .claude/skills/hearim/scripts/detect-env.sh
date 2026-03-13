#!/bin/bash
# 헤아림 환경 감지 스크립트
# SKILL.md에서 !`bash` 동적 주입으로 실행된다.

# 사용자 설정 (bash 배열 형식)
CONFIG="NO_CONFIG"
if [ -f "$HOME/.hearim-config" ]; then
  CONFIG=$(cat "$HOME/.hearim-config")
fi

# Git 정보
GIT_AUTHOR=$(git config user.name 2>/dev/null || echo "unknown")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")
GIT_REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "not-a-git-repo")

# 날짜
TODAY=$(date +%Y-%m-%d)
WEEKDAY=$(LANG=ko_KR.UTF-8 date +%A 2>/dev/null || date +%A)

echo "=== HEARIM ENV ==="
echo "GIT_AUTHOR: $GIT_AUTHOR"
echo "GIT_EMAIL: $GIT_EMAIL"
echo "GIT_REPO: $GIT_REPO"
echo "TODAY: $TODAY"
echo "WEEKDAY: $WEEKDAY"
echo "=== CONFIG ==="
echo "$CONFIG"
