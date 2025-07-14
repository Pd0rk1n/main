#!/bin/bash

# === Brave Browser Unlock Script ===

LOCK_FILE="$HOME/.config/BraveSoftware/Brave-Browser/SingletonLock"

if [ -e "$LOCK_FILE" ]; then
  echo "🔓 Removing Brave browser lock file..."
  rm -f "$LOCK_FILE"
  echo "✅ Lock file removed."
else
  echo "ℹ️ No Brave browser lock file found."
fi
