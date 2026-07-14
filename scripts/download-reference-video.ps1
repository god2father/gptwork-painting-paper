$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ReferenceDir = Join-Path $Root "reference"
$Output = Join-Path $ReferenceDir "reference-video.mp4"
$UrlFile = Join-Path $ReferenceDir "reference-video.url"

New-Item -ItemType Directory -Force -Path $ReferenceDir | Out-Null
$Url = (Get-Content -Raw -Encoding UTF8 $UrlFile).Trim()

$YtDlp = Get-Command yt-dlp -ErrorAction SilentlyContinue
$Python = $null
if (-not $YtDlp) {
    $Python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $Python) { $Python = Get-Command py -ErrorAction SilentlyContinue }
    if (-not $Python) {
        throw "未找到 yt-dlp 或 Python。请安装 Python 3，然后运行：python -m pip install -U yt-dlp"
    }

    Write-Host "未检测到 yt-dlp，正在通过 pip 安装……"
    & $Python.Source -m pip install -U yt-dlp
    if ($LASTEXITCODE -ne 0) { throw "yt-dlp 安装失败。" }
}

function Invoke-Download([string[]]$ExtraArgs) {
    $CommonArgs = @(
        "--no-playlist",
        "--merge-output-format", "mp4",
        "--windows-filenames",
        "-o", $Output
    )
    if ($YtDlp) {
        & $YtDlp.Source @CommonArgs @ExtraArgs $Url
    } else {
        & $Python.Source -m yt_dlp @CommonArgs @ExtraArgs $Url
    }
    return $LASTEXITCODE
}

Write-Host "正在尝试下载参考视频：$Url"
$Code = Invoke-Download @()

if ($Code -ne 0 -or -not (Test-Path $Output)) {
    Write-Host "普通下载失败，尝试读取 Edge 登录 Cookie……" -ForegroundColor Yellow
    $Code = Invoke-Download @("--cookies-from-browser", "edge")
}

if ($Code -ne 0 -or -not (Test-Path $Output)) {
    Write-Host ""
    Write-Host "自动下载失败，常见原因是抖音登录、地区、Cookie 或风控限制。" -ForegroundColor Yellow
    Write-Host "请在抖音中将视频保存到本地，并复制为：" -ForegroundColor Yellow
    Write-Host $Output -ForegroundColor Cyan
    exit 2
}

Write-Host "已保存：$Output" -ForegroundColor Green
