#!/bin/bash

# === AUTO-ELEVATE IF NOT ROOT ===
if [ "$EUID" -ne 0 ]; then
  echo "🔒 This script needs root privileges. Re-running with sudo..."
  exec sudo "$0" "$@"
fi

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
THEMES_SRC="$SCRIPT_DIR/themes"
THEMES_DEST="/usr/share/themes"

# === SAFETY CHECK ===
if [ ! -d "$THEMES_SRC" ]; then
  echo "❌ themes/ directory not found in dotfiles."
  exit 1
fi

# === CREATE DEST DIR IF MISSING ===
mkdir -p "$THEMES_DEST"

# === COPY THEMES ===
echo "📁 Installing themes from $THEMES_SRC to $THEMES_DEST..."
cp -r "$THEMES_SRC"/* "$THEMES_DEST"/

# === DONE ===
echo "✅ Themes installed successfully to $THEMES_DEST."
