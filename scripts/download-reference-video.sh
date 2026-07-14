#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REFERENCE_DIR="$ROOT/reference"
OUTPUT="$REFERENCE_DIR/reference-video.mp4"
URL="$(tr -d '\r\n' < "$REFERENCE_DIR/reference-video.url")"

mkdir -p "$REFERENCE_DIR"

if ! command -v yt-dlp >/dev/null 2>&1; then
  if command -v python3 >/dev/null 2>&1; then
    python3 -m pip install -U yt-dlp
  else
    echo "未找到 yt-dlp 或 Python 3。" >&2
    exit 1
  fi
fi

echo "正在尝试下载参考视频：$URL"
if ! yt-dlp --no-playlist --merge-output-format mp4 -o "$OUTPUT" "$URL"; then
  echo "自动下载失败。请在抖音中保存视频并复制为：$OUTPUT" >&2
  exit 2
fi

echo "已保存：$OUTPUT"
