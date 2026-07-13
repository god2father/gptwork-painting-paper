$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Required = @(
    "README-FIRST.md",
    "WORK_PROMPT.md",
    "AGENTS.md",
    "brief.md",
    "reference\source.json",
    "reference\reference-video.url",
    "docs\visual-style-spec.md",
    "docs\acceptance-criteria.md"
)
$Missing = @()
foreach ($Item in $Required) {
    if (-not (Test-Path (Join-Path $Root $Item))) { $Missing += $Item }
}
if ($Missing.Count -gt 0) {
    Write-Host "缺少以下文件：" -ForegroundColor Red
    $Missing | ForEach-Object { Write-Host "- $_" }
    exit 1
}
if (Test-Path (Join-Path $Root "reference\reference-video.mp4")) {
    Write-Host "项目包完整，参考视频已就位。" -ForegroundColor Green
} else {
    Write-Host "项目包结构完整，但仍需准备 reference\reference-video.mp4。" -ForegroundColor Yellow
}
