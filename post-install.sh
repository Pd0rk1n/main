#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== 1. Updating system package databases ==="
sudo pacman -Syu --noconfirm

# -----------------------------------------------------------------------------
# 2. OFFICIAL REPO PACKAGES (pacman)
# Add whatever CLI tools, media apps, browsers, or utilities you need here.
# -----------------------------------------------------------------------------
OFFICIAL_PACKAGES=(
    # Development & System Tools
    git
    btop
    fastfetch
    wget
    curl
    unzip
    cmatrix
    rofi
    make
    

    # Browsers & Media
    vlc
    brave-bin
    transmission-gtk

    # Utilities
    thunar
    pavucontrol
    polkit-gnome
    variety
    mission-center

)

echo "=== 2. Installing official packages ==="
sudo pacman -S --needed --noconfirm "${OFFICIAL_PACKAGES[@]}"

echo "=== Installation completed successfully! ==="
