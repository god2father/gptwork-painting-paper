$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Video = Join-Path $Root "reference\reference-video.mp4"
$IntervalDir = Join-Path $Root "reference\frames\interval"
$SceneDir = Join-Path $Root "reference\frames\scene"
$AudioDir = Join-Path $Root "reference\audio"
$ContactDir = Join-Path $Root "reference\contact-sheets"
$ProbeJson = Join-Path $Root "reference\ffprobe.json"

if (-not (Test-Path $Video)) {
    throw "缺少 $Video。请先运行 download-reference-video.ps1 或手动复制视频。"
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw "未找到 ffmpeg。" }
if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) { throw "未找到 ffprobe。" }

New-Item -ItemType Directory -Force -Path $IntervalDir, $SceneDir, $AudioDir, $ContactDir | Out-Null
Remove-Item "$IntervalDir\*.jpg" -Force -ErrorAction SilentlyContinue
Remove-Item "$SceneDir\*.jpg" -Force -ErrorAction SilentlyContinue

& ffprobe -v error -show_format -show_streams -of json $Video | Out-File -FilePath $ProbeJson -Encoding utf8
if ($LASTEXITCODE -ne 0) { throw "FFprobe 无法读取参考视频。" }

# 每秒两帧，用于观察连续动画。
& ffmpeg -y -i $Video -vf "fps=2,scale='min(1280,iw)':-2" -q:v 2 "$IntervalDir\frame-%05d.jpg"
if ($LASTEXITCODE -ne 0) { throw "固定间隔关键帧提取失败。" }

# 场景变化帧。
& ffmpeg -y -i $Video -vf "select='gt(scene,0.22)',scale='min(1280,iw)':-2" -vsync vfr -q:v 2 "$SceneDir\scene-%05d.jpg"
if ($LASTEXITCODE -ne 0) { throw "场景关键帧提取失败。" }

# 提取分析用音频，不改变原视频。
& ffmpeg -y -i $Video -vn -ac 1 -ar 16000 "$AudioDir\reference-audio.wav"
if ($LASTEXITCODE -ne 0) { Write-Warning "视频可能没有音轨，音频提取已跳过。" }

# 从完整视频均匀取 20 帧，生成 5x4 联系表。
$Duration = (& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Video).Trim()
& ffmpeg -y -i $Video -vf "fps=20/$Duration,scale=320:-2,tile=5x4:padding=8:margin=8" -frames:v 1 -update 1 "$ContactDir\overview.jpg"
if ($LASTEXITCODE -ne 0) { Write-Warning "联系表生成失败，可由 GPT Work 后续重建。" }

Write-Host "参考视频预处理完成。" -ForegroundColor Green
Write-Host "媒体信息：$ProbeJson"
Write-Host "间隔帧：$IntervalDir"
Write-Host "场景帧：$SceneDir"
Write-Host "联系表：$ContactDir\overview.jpg"
