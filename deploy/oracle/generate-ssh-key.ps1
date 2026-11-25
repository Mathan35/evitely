# Generates an SSH key for Oracle if missing, prints the public key to paste in OCI.
$keyDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $keyDir "invidora-oracle"
$pubPath = "$keyPath.pub"

if (-not (Test-Path $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir | Out-Null
}

if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "invidora-oracle-staging"
    Write-Host "Created $keyPath"
} else {
    Write-Host "Using existing $keyPath"
}

Write-Host ""
Write-Host "=== Paste this PUBLIC key into Oracle Instance → SSH keys ==="
Write-Host ""
Get-Content $pubPath
Write-Host ""
Write-Host "SSH later with:"
Write-Host "  ssh -i `"$keyPath`" ubuntu@YOUR_PUBLIC_IP"
