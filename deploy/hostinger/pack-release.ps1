# Build + zip for Hostinger File Manager upload.
# Output: deploy/hostinger/invidora-hostinger.zip
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root

Write-Host "==> npm run build"
npm run build

$outDir = Join-Path $root 'deploy\hostinger'
$zip = Join-Path $outDir 'invidora-hostinger.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }

$stage = Join-Path $env:TEMP ("invidora-release-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null

$excludeDirs = @(
  '.git', 'node_modules', 'vendor', 'tests', 'storage\framework\views',
  'storage\framework\cache', 'storage\logs', 'storage\inertia-devtools',
  '.cursor', 'deploy\oracle', 'bootstrap\cache'
)

Write-Host "==> Staging files (with public/build, without vendor/node_modules)"
$robolog = Join-Path $env:TEMP 'invidora-robo.log'
$xd = ($excludeDirs | ForEach-Object { "/XD"; $_ })
& robocopy $root $stage /E /NFL /NDL /NJH /NJS /nc /ns /np @xd /XF '.env' '*.zip' | Out-Null
# robocopy exit 0-7 = success
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }

# Ensure empty storage dirs exist
@(
  'storage\app\public',
  'storage\framework\cache',
  'storage\framework\sessions',
  'storage\framework\views',
  'storage\logs',
  'bootstrap\cache'
) | ForEach-Object {
  $p = Join-Path $stage $_
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

Copy-Item (Join-Path $root '.env.hostinger.example') (Join-Path $stage '.env.hostinger.example') -Force

Write-Host "==> Zipping $zip"
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
Remove-Item $stage -Recurse -Force

$sizeMb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "Done: $zip ($sizeMb MB)"
Write-Host ""
Write-Host "Upload zip in hPanel File Manager to domains/invidora.com/"
Write-Host "Extract as folder 'invidora', then SSH: bash deploy/hostinger/setup-on-server.sh"
