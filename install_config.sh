#!/bin/bash

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"   # Get the absolute path to the script directory
BACKUP_DIR="$SCRIPT_DIR/.config"              # .config inside dotfiles/
TARGET_DIR="$HOME/.config"

# === SAFETY CHECK ===
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Backup directory does not exist: $BACKUP_DIR"
  exit 1
fi

# === CONFIRMATION ===
echo "⚠️ This will overwrite files in: $TARGET_DIR"
read -rp "Do you want to continue? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# === CREATE TARGET IF MISSING ===
mkdir -p "$TARGET_DIR"

# === COPY FILES ===
echo "🔁 Restoring .config from $BACKUP_DIR to $TARGET_DIR..."
cp -rT "$BACKUP_DIR" "$TARGET_DIR"

# === PERMISSIONS FIX (optional) ===
chown -R "$USER":"$USER" "$TARGET_DIR"

echo "✅ Restore complete."

