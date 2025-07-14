#!/bin/bash

# Garuda Post-Install Script for Gaming Setup (XFCE Edition)
# Maintainer: ChatGPT for Pd0rk1n
# GitHub Dotfiles: https://github.com/Pd0rk1n/dotfiles.git

set -e

echo "🔧 Disabling zram swap..."
sudo systemctl disable --now zramd || true
sudo pacman -Rns --noconfirm zram-generator zramd || true

echo "🔄 Updating system..."
sudo pacman -Syu --noconfirm

echo "🎮 Installing gaming packages..."
sudo pacman -S --noconfirm steam lutris heroic-games-launcher-bin retroarch \
  gamemode mangohud lib32-mesa lib32-vulkan-icd-loader \
  wine wine-gecko wine-mono winetricks protonup-qt

echo "💡 Enabling GameMode for games..."
mkdir -p ~/.config/environment.d
echo -e "ENABLE_GAMEMODE=1\nLD_PRELOAD=libgamemodeauto.so" > ~/.config/environment.d/gamemode.conf

echo "🐟 Installing Fish shell extras and Dracula Starship prompt..."
sudo pacman -S --noconfirm starship

mkdir -p ~/.config/fish
echo 'eval "$(starship init fish)"' >> ~/.config/fish/config.fish

echo "✨ Setting up Dracula theme for Starship..."
mkdir -p ~/.config
cat << EOF > ~/.config/starship.toml
add_newline = false

[character]
success_symbol = "[➜](bold green)"
error_symbol = "[✗](bold red)"

[username]
style_user = "dracula"
style_root = "bold red"
format = "[$user]($style) "

[directory]
style = "bold blue"
format = "[$path]($style) "

[git_branch]
symbol = " "
style = "purple"

[package]
disabled = true
EOF

echo "📁 Cloning dotfiles from GitHub..."
git clone --depth=1 https://github.com/Pd0rk1n/dotfiles.git ~/dotfiles
cp -r ~/dotfiles/.config/* ~/.config/ || true
cp ~/dotfiles/.bashrc ~/.bashrc 2>/dev/null || true
cp ~/dotfiles/.profile ~/.profile 2>/dev/null || true

echo "🔍 Installing optional tools..."
sudo pacman -S --noconfirm neofetch btop picom thunar-archive-plugin

echo "✅ Setup complete! Please reboot to apply all changes."
