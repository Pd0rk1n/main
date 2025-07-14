#!/bin/bash

set -e  # Exit if any command fails

echo "🔧 Starting full dotfiles installation from: $(pwd)"
echo "-----------------------------------------------"

# === Step 0: Ensure user directories exist ===
if [ -f ./ensure_user_dirs.sh ]; then
  echo "📁 Step 0: Ensuring standard user directories exist..."
  bash ./ensure_user_dirs.sh
else
  echo "⚠️  Skipping: ensure_user_dirs.sh not found."
fi

# === Step 0.5: Create iso/, github/, DATA/, and Projects/ directories ===
echo "📁 Step 0.5: Creating ~/iso, ~/github, ~/DATA, and ~/Projects directories..."
mkdir -p "$HOME/iso" "$HOME/github" "$HOME/DATA" "$HOME/Projects"

# === Step 1: Install user files (pd0rk1n/) ===
if [ -f ./install_pd0rk1n_user_files.sh ]; then
  echo "🧰 Step 1: Installing user files from pd0rk1n/..."
  bash ./install_pd0rk1n_user_files.sh
else
  echo "⚠️  Skipping: install_pd0rk1n_user_files.sh not found."
fi

# === Step 2: Install user config files (.config/) ===
if [ -f ./install_config.sh ]; then
  echo "🧩 Step 2: Installing .config files..."
  bash ./install_config.sh
else
  echo "⚠️  Skipping: install_config.sh not found."
fi

# === Step 3: Install system-wide themes (/usr/share/themes) ===
if [ -f ./install_themes.sh ]; then
  echo "🎨 Step 3: Installing system themes..."
  bash ./install_themes.sh
else
  echo "⚠️  Skipping: install_themes.sh not found."
fi

echo "✅ All steps completed. Your system should now be set up!"

