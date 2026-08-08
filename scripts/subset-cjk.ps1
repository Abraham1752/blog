# 字体子集化：从 google/fonts 可变 TTF → 700 静态 → 站点字符集 woff2
# 用法：node scripts/build-charset.mjs; .\scripts\subset-cjk.ps1
# 新增内容后必须重跑（字符集会变化）。

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'scripts\fonts-src'
$out = Join-Path $root 'src\assets\fonts'
New-Item -ItemType Directory -Path $out -Force | Out-Null

$charset = Join-Path $src 'charset.txt'
if (-not (Test-Path $charset)) {
    Write-Error "charset.txt not found — run: node scripts/build-charset.mjs"
}

$jobs = @(
    @{ In = 'NotoSerifSC.ttf'; Static = 'NotoSerifSC-700.ttf'; Out = 'noto-serif-sc-700.woff2' },
    @{ In = 'NotoSansSC.ttf'; Static = 'NotoSansSC-700.ttf'; Out = 'noto-sans-sc-700.woff2' }
)

foreach ($j in $jobs) {
    $inPath = Join-Path $src $j.In
    $static = Join-Path $src $j.Static
    $woff2 = Join-Path $out $j.Out

    if (-not (Test-Path $inPath)) {
        Write-Error "missing $($j.In) — download from google/fonts first"
    }

    python -m fontTools.varLib.instancer $inPath wght=700 --output $static --quiet
    python -m fontTools.subset $static --text-file=$charset --flavor=woff2 --output-file=$woff2 --layout-features='*' --glyph-names --no-hinting
    $kb = [math]::Round((Get-Item $woff2).Length / 1KB, 0)
    Write-Host "OK $($j.Out) -> ${kb} KB"
}
