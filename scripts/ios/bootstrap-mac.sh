#!/usr/bin/env bash
# Run this on a Mac with Xcode + your Apple Developer account signed in.
# Builds the DropAgent iOS project and opens it for Archive → TestFlight / App Store.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> DropAgent iOS bootstrap"
echo "    Bundle ID: com.lvlltd.dropagent"
echo "    Server:    https://dropagent.lvlltd.com"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org then re-run."
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Xcode command-line tools / Xcode required."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm install
fi

echo "==> Ensuring Capacitor iOS platform"
if [[ ! -d ios/App ]]; then
  npx cap add ios
fi

echo "==> Sync Capacitor (config, plugins, web shell)"
npx cap sync ios

ICON_SRC="$ROOT/ios-assets/AppIcon.appiconset"
ICON_DST="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [[ -d "$ICON_SRC" && -d "$ROOT/ios/App/App/Assets.xcassets" ]]; then
  echo "==> Installing AppIcon.appiconset"
  rm -rf "$ICON_DST"
  cp -R "$ICON_SRC" "$ICON_DST"
fi

PRIV_SRC="$ROOT/ios-assets/PrivacyInfo.xcprivacy"
PRIV_DST="$ROOT/ios/App/App/PrivacyInfo.xcprivacy"
if [[ -f "$PRIV_SRC" ]]; then
  echo "==> Installing PrivacyInfo.xcprivacy"
  cp "$PRIV_SRC" "$PRIV_DST"
fi

node "$ROOT/scripts/ios/apply-ios-permissions.mjs"

echo
echo "==> Opening Xcode"
npx cap open ios

cat <<'NEXT'

Next in Xcode (signed into your Apple Developer account):
  1. Select the App target → Signing & Capabilities
  2. Team: your personal/company team
  3. Bundle Identifier: com.lvlltd.dropagent
  4. Device: Any iOS Device (arm64)
  5. Product → Archive
  6. Distribute App → App Store Connect → Upload
  7. In App Store Connect, create the app if needed, then TestFlight.

Or just use GitHub Actions → "iOS TestFlight" (same path as Come Through).
NEXT
