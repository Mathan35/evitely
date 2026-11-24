# Run AFTER closing Cursor / VS Code / Vite / Herd locks on this folder.
# Converts the temporary junction into a real folder rename.

$ErrorActionPreference = 'Stop'
$sites = 'C:\Users\Abcom\Sites'
$old = Join-Path $sites 'wedding-invitation'
$junction = Join-Path $sites 'evitely'

if (-not (Test-Path $old)) {
    Write-Host "Already renamed (wedding-invitation missing)."
    exit 0
}

# Remove junction pointing at the old folder (does not delete project files).
if (Test-Path $junction) {
    $item = Get-Item $junction
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        cmd /c "rmdir `"$junction`""
        Write-Host "Removed temporary junction: $junction"
    } else {
        Write-Error "C:\Users\Abcom\Sites\evitely exists and is not a junction. Aborting."
        exit 1
    }
}

Rename-Item -Path $old -NewName 'evitely'
Write-Host "Renamed project folder to C:\Users\Abcom\Sites\evitely"
Write-Host "Re-open that folder in Cursor. Start Herd if you use evitely.test."
