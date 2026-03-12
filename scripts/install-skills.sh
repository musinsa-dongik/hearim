#!/bin/bash
set -e

REPO_BASE="https://raw.githubusercontent.com/musinsa-dongik/hearim/main"
CMD_DIR="$HOME/.claude/commands"

echo "=== 헤아림 스킬 설치 ==="
echo ""

# 1. ~/.claude/commands 디렉토리 생성
mkdir -p "$CMD_DIR"

# 2. 스킬 파일 다운로드
echo "스킬 다운로드 중..."
curl -sf "$REPO_BASE/.claude/commands/hearim-daily.md" -o "$CMD_DIR/hearim-daily.md"
echo "  ✓ hearim-daily.md"

curl -sf "$REPO_BASE/.claude/commands/hearim-push.md" -o "$CMD_DIR/hearim-push.md"
echo "  ✓ hearim-push.md"

# 3. ~/.hearim-config 템플릿 생성 (이미 있으면 건너뜀)
if [ ! -f "$HOME/.hearim-config" ]; then
  cat > "$HOME/.hearim-config" << 'CONF'
# 헤아림 데일리 - 사용자별 레포 목록
# /hearim-daily 실행 시 커밋을 수집할 프로젝트 경로
# 본인의 프로젝트 경로로 수정하세요
HEARIM_REPOS=(
  # "$HOME/Documents/GitHub/my-project"
)
CONF
  echo "  ✓ ~/.hearim-config 생성 (레포 경로를 수정하세요)"
else
  echo "  - ~/.hearim-config 이미 존재 (건너뜀)"
fi

# 4. ~/ai-workspace/hearim/daily 디렉토리 생성
mkdir -p "$HOME/ai-workspace/hearim/daily"
echo "  ✓ ~/ai-workspace/hearim/daily/ 디렉토리 생성"

# 5. 안내
echo ""
echo "=== 설치 완료 ==="
echo ""
echo "사용법:"
echo "  1. Claude Code에서 /hearim-daily → 학습 기록 md 생성"
echo "  2. Claude Code에서 /hearim-push  → DB에 draft로 저장"
echo ""
echo "추가 설정:"
echo "  - ~/.hearim-config  → 커밋 수집할 레포 경로 추가"
echo "  - ~/hearim/.env.local → Supabase 키 설정 (/hearim-push용)"
echo ""
