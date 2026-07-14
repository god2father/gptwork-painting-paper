#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEO="$ROOT/reference/reference-video.mp4"
INTERVAL_DIR="$ROOT/reference/frames/interval"
SCENE_DIR="$ROOT/reference/frames/scene"
AUDIO_DIR="$ROOT/reference/audio"
CONTACT_DIR="$ROOT/reference/contact-sheets"

[[ -f "$VIDEO" ]] || { echo "缺少 $VIDEO" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "未找到 ffmpeg" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "未找到 ffprobe" >&2; exit 1; }

mkdir -p "$INTERVAL_DIR" "$SCENE_DIR" "$AUDIO_DIR" "$CONTACT_DIR"
rm -f "$INTERVAL_DIR"/*.jpg "$SCENE_DIR"/*.jpg

ffprobe -v error -show_format -show_streams -of json "$VIDEO" > "$ROOT/reference/ffprobe.json"
ffmpeg -y -i "$VIDEO" -vf "fps=2,scale='min(1280,iw)':-2" -q:v 2 "$INTERVAL_DIR/frame-%05d.jpg"
ffmpeg -y -i "$VIDEO" -vf "select='gt(scene,0.22)',scale='min(1280,iw)':-2" -vsync vfr -q:v 2 "$SCENE_DIR/scene-%05d.jpg"
ffmpeg -y -i "$VIDEO" -vn -ac 1 -ar 16000 "$AUDIO_DIR/reference-audio.wav" || true
ffmpeg -y -start_number 1 -i "$INTERVAL_DIR/frame-%05d.jpg" -vf "scale=320:-2,tile=5x4:padding=8:margin=8" -frames:v 1 "$CONTACT_DIR/overview.jpg" || true

echo "参考视频预处理完成。"
