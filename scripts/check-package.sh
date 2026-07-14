#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
required=(
  README-FIRST.md WORK_PROMPT.md AGENTS.md brief.md
  reference/source.json reference/reference-video.url
  docs/visual-style-spec.md docs/acceptance-criteria.md
)
for item in "${required[@]}"; do
  [[ -e "$ROOT/$item" ]] || { echo "缺少：$item" >&2; exit 1; }
done
if [[ -f "$ROOT/reference/reference-video.mp4" ]]; then
  echo "项目包完整，参考视频已就位。"
else
  echo "项目包结构完整，但仍需准备 reference/reference-video.mp4。"
fi
