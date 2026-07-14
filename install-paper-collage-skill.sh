#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$ROOT/.codex/skills/paper-collage-ad"
mkdir -p "$(dirname "$TARGET")"
if [[ -d "$TARGET" ]]; then
  echo "Skill 已存在：$TARGET"
  exit 0
fi
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git "$TARGET"
echo "Skill 已安装到：$TARGET"
