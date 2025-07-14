#!/usr/bin/env bash

set -e

echo "🔑 Setting up all required repositories and keys..."

### --- [1] Arch Mirrors Update (Optional) ---
echo "🌀 Updating Arch Linux mirrorlist..."
reflector --country 'Canada' --latest 10 --sort rate --save /etc/pacman.d/mirrorlist

### --- [2] Chaotic-AUR Setup ---
if ! pacman -Qi chaotic-keyring &>/dev/null; then
  echo "📦 Adding Chaotic-AUR..."
  pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
  pacman-key --lsign-key 3056513887B78AEB
  pacman -U --noconfirm 'https://cdn.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst'
  pacman -U --noconfirm 'https://cdn.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'

  echo "[chaotic-aur]
Include = /etc/pacman.d/chaotic-mirrorlist" >> /etc/pacman.conf
fi

### --- [3] Nemesis_repo Setup ---
if ! grep -q "\[nemesis_repo\]" /etc/pacman.conf; then
  echo "🧪 Adding Nemesis_repo..."
  echo "[nemesis_repo]
SigLevel = Optional TrustAll
Server = https://erikdubois.be/nemesis_repo/\$arch" >> /etc/pacman.conf
fi

### --- [4] EndeavourOS Repo Setup ---
if ! pacman -Qi endeavouros-keyring &>/dev/null; then
  echo "🚀 Adding EndeavourOS repo and key..."
  pacman-key --recv-keys F5645D06D144B6F0 --keyserver keyserver.ubuntu.com
  pacman-key --lsign-key F5645D06D144B6F0
  pacman -Syy --noconfirm endeavouros-keyring endeavouros-mirrorlist

  echo "[endeavouros]
SigLevel = PackageRequired
Include = /etc/pacman.d/endeavouros-mirrorlist" >> /etc/pacman.conf
fi

### --- [5] Sync All Repos ---
echo "🔄 Syncing pacman..."
pacman -Syy

