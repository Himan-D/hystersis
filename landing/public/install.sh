#!/bin/sh
set -e
REPO="Himan-D/hystersis"
echo "Hystersis installer — https://code.hystersis.com"
echo "Resolving latest release for $REPO ..."

# Detect OS/ARCH -> artifact name matching .github/workflows/release.yml
OS=$(uname -s)
ARCH=$(uname -m)
case "${OS}-${ARCH}" in
  Darwin-arm64)          BINARY="hystersis-macos-arm64" ;;
  Darwin-x86_64)         BINARY="hystersis-macos-x64"   ;;
  Linux-x86_64)          BINARY="hystersis-linux-x64"   ;;
  Linux-aarch64|Linux-arm64) BINARY="hystersis-linux-arm64" ;;
  *)
    echo "Unsupported platform: ${OS}-${ARCH}"
    echo "Build from source: cargo install --git https://github.com/${REPO} --package xai-hystersis-pager-bin --bin xai-hystersis-pager"
    exit 1
    ;;
esac

# Fetch latest release JSON
API="https://api.github.com/repos/${REPO}/releases/latest"
RELEASE_JSON=""
if command -v curl >/dev/null 2>&1; then
  RELEASE_JSON=$(curl -fsSL "$API" 2>/dev/null || true)
elif command -v wget >/dev/null 2>&1; then
  RELEASE_JSON=$(wget -qO- "$API" 2>/dev/null || true)
fi

VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' || true)

if [ -z "$VERSION" ]; then
  echo ""
  echo "No published release found for ${REPO}."
  echo "Build from source:"
  echo "  cargo install --git https://github.com/${REPO} --package xai-hystersis-pager-bin --bin xai-hystersis-pager"
  echo ""
  echo "Or wait for: https://github.com/${REPO}/releases"
  exit 1
fi

# Check that the binary asset actually exists in this release
ASSET_URL=$(echo "$RELEASE_JSON" | grep "browser_download_url" | grep "${BINARY}" | sed -E 's/.*"([^"]+)".*/\1/' || true)

if [ -z "$ASSET_URL" ]; then
  echo ""
  echo "Release ${VERSION} found but binaries are still building."
  echo "Check: https://github.com/${REPO}/releases/tag/${VERSION}"
  echo ""
  echo "Try again in a few minutes, or build from source:"
  echo "  cargo install --git https://github.com/${REPO} --package xai-hystersis-pager-bin --bin xai-hystersis-pager"
  exit 1
fi

DEST="/usr/local/bin/hystersis"
echo "→ Downloading ${BINARY} ${VERSION} ..."
echo "  ${ASSET_URL}"

if [ -w "/usr/local/bin" ]; then
  curl -fsSL "${ASSET_URL}" -o "${DEST}"
  chmod +x "${DEST}"
  echo ""
  echo "✅ Installed to ${DEST}"
  echo "   Run: hystersis configure    (set up your API key)"
  echo "   Run: hystersis              (start coding)"
else
  mkdir -p "$HOME/.local/bin"
  DEST="$HOME/.local/bin/hystersis"
  curl -fsSL "${ASSET_URL}" -o "${DEST}"
  chmod +x "${DEST}"
  echo ""
  echo "✅ Installed to ${DEST}"
  echo "   Add to PATH: export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo "   Run: hystersis configure    (set up your API key)"
  echo "   Run: hystersis              (start coding)"
fi
