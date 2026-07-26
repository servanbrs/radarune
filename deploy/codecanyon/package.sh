#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="${VERSION:-$(node -p 'require("./package.json").version')}"
OUTPUT_DIR="$ROOT_DIR/dist"
PACKAGE_DIR="$OUTPUT_DIR/radarune-$VERSION"
ARCHIVE="$OUTPUT_DIR/radarune-codecanyon-$VERSION.zip"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

cd "$ROOT_DIR"
command -v git >/dev/null || { printf '%s\n' "git gerekli." >&2; exit 1; }
command -v zip >/dev/null || { printf '%s\n' "zip komutu gerekli." >&2; exit 1; }

mkdir -p "$OUTPUT_DIR"
git archive --format=tar --prefix="radarune-$VERSION/" HEAD | tar -x -C "$TEMP_DIR"
mv "$TEMP_DIR/radarune-$VERSION" "$PACKAGE_DIR"
cp deploy/codecanyon/README.md "$PACKAGE_DIR/CODECANYON-INSTALLATION.md"
rm -f "$ARCHIVE"
(cd "$OUTPUT_DIR" && zip -qr "$(basename "$ARCHIVE")" "$(basename "$PACKAGE_DIR")")
rm -rf "$PACKAGE_DIR"

printf '%s\n' "CodeCanyon paketi hazır: $ARCHIVE"
