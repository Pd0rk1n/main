#!/bin/bash

# === Use default XDG dirs or fallback list ===
XDG_DIRS=()

if command -v xdg-user-dirs > /dev/null; then
  echo "📁 Using xdg-user-dirs to detect expected user folders..."
  mapfile -t XDG_DIRS < <(xdg-user-dir DESKTOP DOCUMENTS DOWNLOAD MUSIC PICTURES PUBLICSHARE TEMPLATES VIDEOS)
else
  echo "⚠️ xdg-user-dirs not found. Falling back to standard folder names..."
  XDG_DIRS=(
    "$HOME/Desktop"
    "$HOME/Documents"
    "$HOME/Downloads"
    "$HOME/Music"
    "$HOME/Pictures"
    "$HOME/Public"
    "$HOME/Templates"
    "$HOME/Videos"
  )
fi

# === Create missing directories ===
echo "🔍 Checking for missing user directories..."

for dir in "${XDG_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "📂 Creating missing directory: $dir"
    mkdir -p "$dir"
  else
    echo "✅ Exists: $dir"
  fi
done

echo "✅ All required user directories are present."
