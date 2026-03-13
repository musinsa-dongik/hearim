#!/bin/bash
set -e

REPO_BASE="https://raw.githubusercontent.com/musinsa-dongik/hearim/main"
SKILL_DIR="$HOME/.claude/skills"
SHELL_RC="$HOME/.zshrc"

echo "=== 헤아림 스킬 설치 ==="
echo ""

# 1. skills 디렉토리 생성
mkdir -p "$SKILL_DIR/hearim/templates"
mkdir -p "$SKILL_DIR/hearim/scripts"
mkdir -p "$SKILL_DIR/hearim-push"

# 2. 스킬 파일 다운로드
echo "[1/5] 스킬 다운로드 중..."

# hearim (메인 스킬)
curl -sf "$REPO_BASE/.claude/skills/hearim/SKILL.md" -o "$SKILL_DIR/hearim/SKILL.md"
curl -sf "$REPO_BASE/.claude/skills/hearim/collectors.md" -o "$SKILL_DIR/hearim/collectors.md"
curl -sf "$REPO_BASE/.claude/skills/hearim/tutor-persona.md" -o "$SKILL_DIR/hearim/tutor-persona.md"
curl -sf "$REPO_BASE/.claude/skills/hearim/templates/daily.md" -o "$SKILL_DIR/hearim/templates/daily.md"
curl -sf "$REPO_BASE/.claude/skills/hearim/templates/weekly.md" -o "$SKILL_DIR/hearim/templates/weekly.md"
curl -sf "$REPO_BASE/.claude/skills/hearim/scripts/detect-env.sh" -o "$SKILL_DIR/hearim/scripts/detect-env.sh"
chmod +x "$SKILL_DIR/hearim/scripts/detect-env.sh"
echo "  OK hearim (데일리/위클리)"

# hearim-push (DB 저장)
curl -sf "$REPO_BASE/.claude/skills/hearim-push/SKILL.md" -o "$SKILL_DIR/hearim-push/SKILL.md"
echo "  OK hearim-push (DB 저장)"

# 3. 레포 설정 (~/.hearim-config)
echo ""
echo "[2/5] 커밋 수집 레포 설정"

if [ -f "$HOME/.hearim-config" ]; then
  echo "  ~/.hearim-config 이미 존재합니다:"
  cat "$HOME/.hearim-config"
  echo ""
  read -p "  덮어쓰시겠습니까? (y/N): " overwrite
  if [[ "$overwrite" != "y" && "$overwrite" != "Y" ]]; then
    echo "  기존 설정 유지"
  else
    WRITE_CONFIG=true
  fi
else
  WRITE_CONFIG=true
fi

if [ "$WRITE_CONFIG" = true ]; then
  echo ""
  echo "  /hearim 실행 시 아래 레포들의 커밋을 수집합니다."
  echo "  본인이 작업하는 프로젝트 경로를 입력하세요."
  echo "  (빈 줄 입력 시 종료)"
  echo ""

  REPOS=()
  INDEX=1
  while true; do
    read -p "  레포 경로 $INDEX (예: ~/Documents/GitHub/my-project): " repo_path
    if [ -z "$repo_path" ]; then
      break
    fi
    # ~ 를 $HOME으로 확장
    expanded_path="${repo_path/#\~/$HOME}"
    if [ -d "$expanded_path/.git" ]; then
      REPOS+=("$repo_path")
      echo "    OK: $(basename "$expanded_path")"
    else
      echo "    SKIP: Git 레포가 아닙니다 ($expanded_path)"
    fi
    INDEX=$((INDEX + 1))
  done

  # config 파일 생성
  cat > "$HOME/.hearim-config" << 'HEADER'
# 헤아림 - 커밋 수집 레포 목록
# /hearim 실행 시 아래 레포들의 커밋을 수집합니다.
# 경로를 추가/제거하려면 이 파일을 직접 편집하세요.
HEARIM_REPOS=(
HEADER

  if [ ${#REPOS[@]} -eq 0 ]; then
    echo '  # 예시: "$HOME/Documents/GitHub/my-project"' >> "$HOME/.hearim-config"
  else
    for repo in "${REPOS[@]}"; do
      echo "  \"$repo\"" >> "$HOME/.hearim-config"
    done
  fi
  echo ")" >> "$HOME/.hearim-config"

  echo ""
  if [ ${#REPOS[@]} -eq 0 ]; then
    echo "  ~/.hearim-config 생성 (레포 미등록 - 현재 레포 커밋만 수집)"
    echo "  나중에 ~/.hearim-config 를 편집하여 레포를 추가할 수 있습니다."
  else
    echo "  ~/.hearim-config 생성 (${#REPOS[@]}개 레포 등록)"
  fi
fi

# 4. 출력 디렉토리 생성
echo ""
echo "[3/5] 출력 디렉토리 생성"
mkdir -p "$HOME/ai-workspace/hearim/daily"
mkdir -p "$HOME/ai-workspace/hearim/weekly"
echo "  OK ~/ai-workspace/hearim/daily/"
echo "  OK ~/ai-workspace/hearim/weekly/"

# 5. 환경 변수 설정 (~/.zshrc)
echo ""
echo "[4/5] 환경 변수 설정"
if grep -q "HEARIM_SUPABASE_URL" "$SHELL_RC" 2>/dev/null; then
  echo "  환경 변수 이미 존재 (건너뜀)"
else
  cat >> "$SHELL_RC" << 'ZSHRC'

# === 헤아림 ===
export HEARIM_SUPABASE_URL="https://uoubxqesmvpvtqcghvps.supabase.co"
export HEARIM_SERVICE_ROLE_KEY="여기에_서비스_롤_키_입력"
ZSHRC
  echo "  OK ~/.zshrc에 환경 변수 추가"
fi

# 6. 레거시 commands 정리 안내
echo ""
echo "[5/5] 레거시 확인"
LEGACY_CMD="$HOME/.claude/commands"
if [ -f "$LEGACY_CMD/hearim-daily.md" ] || [ -f "$LEGACY_CMD/hearim-push.md" ]; then
  echo "  기존 commands 파일이 발견되었습니다:"
  [ -f "$LEGACY_CMD/hearim-daily.md" ] && echo "    - ~/.claude/commands/hearim-daily.md"
  [ -f "$LEGACY_CMD/hearim-push.md" ] && echo "    - ~/.claude/commands/hearim-push.md"
  echo "  skills가 commands보다 우선하므로 충돌은 없지만,"
  echo "  정리하려면 위 파일들을 삭제하세요."
else
  echo "  레거시 파일 없음"
fi

# 7. 완료 안내
echo ""
echo "========================================="
echo "  헤아림 스킬 설치 완료"
echo "========================================="
echo ""
echo "  필수 설정:"
echo "    1. ~/.zshrc의 HEARIM_SERVICE_ROLE_KEY를 실제 키로 교체"
echo "       (팀 리드에게 DM으로 전달받기)"
echo "    2. source ~/.zshrc"
echo ""
echo "  선택 설정:"
echo "    - ~/.hearim-config 편집 -> 커밋 수집 레포 추가/변경"
echo ""
echo "  사용법:"
echo "    /hearim              -> 오늘의 학습 기록 생성"
echo "    /hearim daily 2026-03-12  -> 특정 날짜 학습 기록"
echo "    /hearim weekly       -> 위클리 스터디 기록"
echo "    /hearim-push         -> DB에 draft로 저장"
echo ""
