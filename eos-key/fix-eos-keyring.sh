#!/bin/bash

# EndeavourOS Key ID
KEY_ID="A367FB01AE54040E"
PKG_CACHE="/var/cache/pacman/pkg/endeavouros-keyring-20231222-1-any.pkg.tar.zst"

echo ">>> Importing and trusting EndeavourOS key..."
sudo pacman-key --recv-keys "$KEY_ID"
sudo pacman-key --lsign-key "$KEY_ID"

echo ">>> Removing cached EndeavourOS keyring package if it exists..."
[ -f "$PKG_CACHE" ] && sudo rm "$PKG_CACHE"

echo ">>> Installing endeavouros-keyring package..."
sudo pacman -S --noconfirm endeavouros-keyring

echo ">>> Populating endeavouros keys..."
sudo pacman-key --populate endeavouros

echo ">>> Ensuring repo is in pacman.conf..."
if ! grep -q "\[endeavouros\]" /etc/pacman.conf; then
  echo -e "\n[endeavouros]\nServer = https://mirror.endeavouros.com/\$arch/\$repo" | sudo tee -a /etc/pacman.conf
  echo ">>> Added endeavouros repo to pacman.conf"
else
  echo ">>> endeavouros repo already exists in pacman.conf"
fi

echo ">>> Updating package databases and system..."
sudo pacman -Syyu

echo ">>> Done. EndeavourOS keyring and repo should now be working."
