#!/bin/bash
# Fully configure pacman with Erik Dubois settings and EndeavourOS repo + keyring

set -e

# === CONFIG ===
KEY_ID="A367FB01AE54040E"
PKG_CACHE="/var/cache/pacman/pkg/endeavouros-keyring-*.pkg.tar.zst"
MIRRORLIST_PATH="/etc/pacman.d/endeavouros-mirrorlist"
PACMAN_CONF="/etc/pacman.conf"

# === 1. Write pacman.conf ===
echo ">>> Writing /etc/pacman.conf..."
sudo tee "$PACMAN_CONF" > /dev/null << 'EOF'
# Erik Dubois
# /etc/pacman.conf

[options]
HoldPkg = pacman glibc
Architecture = auto
Color
CheckSpace
VerbosePkgLists
ParallelDownloads = 30
ILoveCandy
DisableDownloadTimeout
SigLevel = Required DatabaseOptional
LocalFileSigLevel = Optional

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

[multilib]
Include = /etc/pacman.d/mirrorlist

[nemesis_repo]
SigLevel = Never
Server = https://erikdubois.github.io/$repo/$arch

[chaotic-aur]
SigLevel = Required DatabaseOptional
Include = /etc/pacman.d/chaotic-mirrorlist

[endeavouros]
SigLevel = PackageRequired
Include = /etc/pacman.d/endeavouros-mirrorlist
EOF

# === 2. Write endeavouros-mirrorlist ===
echo ">>> Writing /etc/pacman.d/endeavouros-mirrorlist..."
sudo tee "$MIRRORLIST_PATH" > /dev/null << 'EOF'
######################################################
####                                              ####
###        EndeavourOS Repository Mirrorlist       ###
####                                              ####
######################################################
### Tip: Use the 'eos-rankmirrors' program to rank
###      these mirrors or re-order them manually.
######################################################

## Australia
Server = https://mirror.b-interactive.com.au/endeavouros/repo/$repo/$arch

## Belgium
Server = https://ftp.belnet.be/mirror/endeavouros/repo/$repo/$arch

## China
Server = https://mirrors.tuna.tsinghua.edu.cn/endeavouros/repo/$repo/$arch
Server = https://mirrors.jlu.edu.cn/endeavouros/repo/$repo/$arch
Server = https://mirror.sjtu.edu.cn/endeavouros/repo/$repo/$arch

## Denmark
Server = https://mirrors.c0urier.net/linux/endeavouros/repo/$repo/$arch

## France
Server = https://mirror.rznet.fr/endeavouros/repo/$repo/$arch

## Germany
Server = https://mirror.alpix.eu/endeavouros/repo/$repo/$arch
Server = https://mirror.moson.org/endeavouros/repo/$repo/$arch
Server = https://ftp.rz.tu-bs.de/pub/mirror/endeavouros/repo/$repo/$arch

## Greece
Server = https://fosszone.csd.auth.gr/endeavouros/repo/$repo/$arch

## India
Server = https://mirror.nag.albony.in/endeavouros/repo/$repo/$arch
Server = https://mirrors.nxtgen.com/endeavouros-mirror/repo/$repo/$arch

## Japan
Server = https://www.miraa.jp/endeavouros/repo/$repo/$arch

## Moldova
Server = https://md.mirrors.hacktegic.com/endeavouros/repo/$repo/$arch

## Portugal
Server = https://mirror.leitecastro.com/endeavouros/repo/$repo/$arch

## Singapore
Server = https://mirror.jingk.ai/endeavouros/repo/$repo/$arch
Server = https://mirror.freedif.org/EndeavourOS/repo/$repo/$arch

## South Africa
Server = https://mirrors.urbanwave.co.za/endeavouros/repo/$repo/$arch

## South Korea
Server = https://mirror.funami.tech/endeavouros/repo/$repo/$arch

## Sweden
Server = https://mirror.accum.se/mirror/endeavouros/repo/$repo/$arch

## Switzerland
Server = https://mirror.gofoss.xyz/endeavouros/repo/$repo/$arch
Server = https://pkg.adfinis-on-exoscale.ch/endeavouros/repo/$repo/$arch

## Taiwan
Server = https://mirror.archlinux.tw/EndeavourOS/repo/$repo/$arch

## Ukraine
Server = https://distrohub.kyiv.ua/endeavouros/repo/$repo/$arch

## United Kingdom
Server = https://repo.c48.uk/endeavouros/repo/$repo/$arch

## United States
Server = https://mirrors.gigenet.com/endeavouros/repo/$repo/$arch
EOF

# === 3. Import Key ===
echo ">>> Importing and trusting EndeavourOS key..."
if ! sudo pacman-key --keyserver hkps://keyserver.ubuntu.com --recv-keys "$KEY_ID"; then
    echo ">>> Keyserver failed. Continuing anyway to install keyring package directly."
fi
sudo pacman-key --lsign-key "$KEY_ID" || true

# === 4. Clean cache + Install keyring ===
echo ">>> Cleaning any cached keyring package..."
sudo rm -f $PKG_CACHE

echo ">>> Installing endeavouros-keyring package..."
sudo pacman -Sy --noconfirm endeavouros-keyring

echo ">>> Populating keys from keyring..."
sudo pacman-key --populate endeavouros

# === 5. Refresh repos ===
echo ">>> Refreshing package databases..."
sudo pacman -Syyu --noconfirm

echo ">>> Done. EndeavourOS repo and keyring installed and pacman configured."
