$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Target = Join-Path $Root ".codex\skills\paper-collage-ad"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
if (Test-Path $Target) {
    Write-Host "Skill 已存在：$Target" -ForegroundColor Yellow
    exit 0
}
& git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git $Target
if ($LASTEXITCODE -ne 0) { throw "Skill 克隆失败。" }
Write-Host "Skill 已安装到：$Target" -ForegroundColor Green
