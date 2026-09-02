# Hystersis Windows installer — https://code.hystersis.com/install.ps1
# Usage: powershell -NoProfile -c "irm https://code.hystersis.com/install.ps1 | iex"
$ErrorActionPreference = "Stop"
$REPO = "Himan-D/hystersis"
Write-Host "Hystersis installer — https://code.hystersis.com"
Write-Host "Resolving latest release for $REPO ..."

$arch = $env:PROCESSOR_ARCHITECTURE
if ($arch -eq "ARM64") { $BINARY = "hystersis-windows-arm64" } else { $BINARY = "hystersis-windows-x64" }
# Fallback: core releases currently publish macos/linux only — map to cargo fallback if missing
# Try GitHub latest tag
try {
  $api = "https://api.github.com/repos/$REPO/releases/latest"
  $rel = Invoke-RestMethod -Uri $api -UseBasicParsing
  $VERSION = $rel.tag_name
} catch {
  Write-Host ""
  Write-Host "No published release found yet for $REPO."
  Write-Host "Install from source:"
  Write-Host "  cargo install --git https://github.com/$REPO --package xai-hystersis-pager-bin --bin xai-hystersis-pager"
  exit 0
}

if (-not $VERSION) {
  Write-Host "No version resolved — install from source: cargo install --git https://github.com/$REPO"
  exit 1
}

$URL = "https://github.com/$REPO/releases/download/$VERSION/$BINARY"
$DEST = "$env:USERPROFILE\.local\bin\hystersis.exe"
New-Item -ItemType Directory -Force -Path (Split-Path $DEST) | Out-Null
Write-Host "-> Downloading $BINARY $VERSION ..."
Write-Host "   $URL"
try {
  Invoke-WebRequest -Uri $URL -OutFile $DEST -UseBasicParsing
} catch {
  Write-Host ""
  Write-Host "Binary not found: $URL"
  Write-Host "Available at: https://github.com/$REPO/releases/tag/$VERSION"
  Write-Host "Fallback:"
  Write-Host "  cargo install --git https://github.com/$REPO --package xai-hystersis-pager-bin"
  Remove-Item $DEST -ErrorAction SilentlyContinue
  exit 1
}
Write-Host "Installed to $DEST (add $env:USERPROFILE\.local\bin to PATH)"
try { & $DEST --version } catch {}
