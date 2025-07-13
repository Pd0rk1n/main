#!/bin/bash

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/pd0rk1n"
DEST_DIR="$HOME"

# === SAFETY CHECK ===
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ pd0rk1n/ directory not found in dotfiles."
  exit 1
fi

# === CONFIRMATION ===
echo "⚠️ This will copy the contents of 'pd0rk1n/' into your home directory: $DEST_DIR"
read -rp "Continue? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# === COPY FILES ===
echo "📂 Installing pd0rk1n files to $DEST_DIR..."
cp -rvT "$SOURCE_DIR" "$DEST_DIR"

# === FIX PERMISSIONS (optional) ===
chown -R "$USER:$USER" "$DEST_DIR"

echo "✅ pd0rk1n user files installed successfully to your home directory."
