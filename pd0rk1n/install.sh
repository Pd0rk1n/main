#!/usr/bin/env bash
set -e

echo -e "\n🚀 Starting Full Post-Install Setup for Arch + Chaotic-AUR + Nemesis + EndeavourOS...\n"

### === [1] Update Arch Mirrors ===
echo -e "\n🌀 Updating Arch Linux mirrorlist..."
reflector --country 'Canada' --latest 10 --sort rate --save /etc/pacman.d/mirrorlist

### === [2] Setup Chaotic-AUR ===
echo -e "\n📦 Adding Chaotic-AUR repository..."
if ! pacman -Qi chaotic-keyring &>/dev/null; then
  pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
  pacman-key --lsign-key 3056513887B78AEB
  pacman -U --noconfirm https://cdn.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst
  pacman -U --noconfirm https://cdn.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst
fi
grep -q "\[chaotic-aur\]" /etc/pacman.conf || echo -e "\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist" >> /etc/pacman.conf

### === [3] Setup Nemesis Repo ===
echo -e "\n🧪 Adding Erik Dubois' Nemesis_repo..."
grep -q "\[nemesis_repo\]" /etc/pacman.conf || echo -e "\n[nemesis_repo]\nSigLevel = Optional TrustAll\nServer = https://erikdubois.be/nemesis_repo/\$arch" >> /etc/pacman.conf

### === [4] Setup EndeavourOS Repo ===
echo -e "\n🚀 Adding EndeavourOS repository..."
if ! pacman -Qi endeavouros-keyring &>/dev/null; then
  pacman-key --recv-keys F5645D06D144B6F0 --keyserver keyserver.ubuntu.com
  pacman-key --lsign-key F5645D06D144B6F0
  pacman -Syy --noconfirm endeavouros-keyring endeavouros-mirrorlist
fi
grep -q "\[endeavouros\]" /etc/pacman.conf || echo -e "\n[endeavouros]\nSigLevel = PackageRequired\nInclude = /etc/pacman.d/endeavouros-mirrorlist" >> /etc/pacman.conf

### === [5] Refresh All Repos ===
echo -e "\n🔄 Syncing all repositories..."
pacman -Syy

### === [6] Ensure yay-git is installed ===
echo -e "\n📥 Ensuring yay-git is available..."
if ! command -v yay &>/dev/null; then
  pacman -S --noconfirm yay-git
fi

### === [7] Define package groups ===

declare -A groups

groups[base]=\
"base
base-devel
linux
linux-firmware
linux-headers
intel-ucode
efibootmgr
yay-git"

groups[terminal_shell]=\
"alacritty
bat
bat-extras
duf
fastfetch
fish
git
htop
meld
nano
neofetch-git
starship
vim
wget"

groups[themes_look]=\
"archlinux-wallpaper
lxappearance-gtk3
neo-candy-icons-git
nitrogen
variety"

groups[fonts]=\
"noto-fonts
noto-fonts-cjk
noto-fonts-emoji
noto-fonts-extra
ttf-0xproto-nerd
ttf-3270-nerd
ttf-agave-nerd
ttf-anonymouspro-nerd
ttf-arimo-nerd
ttf-bigblueterminal-nerd
ttf-bitstream-vera
ttf-bitstream-vera-mono-nerd
ttf-cascadia-code-nerd
ttf-cascadia-mono-nerd
ttf-cousine-nerd
ttf-d2coding-nerd
ttf-daddytime-mono-nerd
ttf-dejavu-nerd
ttf-envycoder-nerd
ttf-fantasque-nerd
ttf-firacode-nerd
ttf-gohu-nerd
ttf-go-nerd
ttf-hack-nerd
ttf-heavydata-nerd
ttf-iawriter-nerd
ttf-ibmplex-mono-nerd
ttf-inconsolata-go-nerd
ttf-inconsolata-lgc-nerd
ttf-inconsolata-nerd
ttf-intone-nerd
ttf-iosevka-nerd
ttf-iosevkaterm-nerd
ttf-iosevkatermslab-nerd
ttf-jetbrains-mono-nerd
ttf-lekton-nerd
ttf-liberation-mono-nerd
ttf-lilex-nerd
ttf-martian-mono-nerd
ttf-meslo-nerd
ttf-monofur-nerd
ttf-monoid-nerd
ttf-mononoki-nerd
ttf-mplus-nerd
ttf-nerd-fonts-symbols
ttf-nerd-fonts-symbols-mono
ttf-noto-nerd
ttf-profont-nerd
ttf-proggyclean-nerd
ttf-recursive-nerd
ttf-roboto-mono-nerd
ttf-sharetech-mono-nerd
ttf-sourcecodepro-nerd
ttf-space-mono-nerd
ttf-terminus-nerd
ttf-tinos-nerd
ttf-ubuntu-font-family
ttf-ubuntu-mono-nerd
ttf-ubuntu-nerd
ttf-victor-mono-nerd
ttf-zed-mono-nerd
otf-aurulent-nerd
otf-codenewroman-nerd
otf-comicshanns-nerd
otf-commit-mono-nerd
otf-droid-nerd
otf-firamono-nerd
otf-geist-mono-nerd
otf-hasklig-nerd
otf-hermit-nerd
otf-monaspace-nerd
otf-opendyslexic-nerd
otf-overpass-nerd"

groups[audio]=\
"parole
pavucontrol
pulseaudio
xfce4-pulseaudio-plugin"

groups[network]=\
"brave-bin
firefox
firefox-adblock-plus
firefox-dark-reader
firefox-ublock-origin
gvfs-smb
iwd
networkmanager
network-manager-applet
samba
transmission-gtk
wireless_tools"

groups[system_tools]=\
"archlinux-logout-git
archlinux-tweak-tool-git
betterlockscreen
chaotic-keyring
chaotic-mirrorlist
dconf-editor
gnome-keyring
intel-media-driver
libva-intel-driver
lightdm
lightdm-slick-greeter
mission-center
power-profiles-daemon
smartmontools
ubuntu-keyring
ufw
ulauncher
xarchiver
xdg-user-dirs
xdg-utils"

groups[file_managers]=\
"nemo
nemo-fileroller
nemo-share
nemo-terminal
thunar
thunar-archive-plugin
thunar-media-tags-plugin
thunar-volman
tumbler
xed"

groups[desktop_wm]=\
"qtile
rofi
wike
xfce4-appfinder
xfce4-artwork
xfce4-battery-plugin
xfce4-clipman-plugin
xfce4-cpufreq-plugin
xfce4-cpugraph-plugin
xfce4-dict
xfce4-diskperf-plugin
xfce4-eyes-plugin
xfce4-fsguard-plugin
xfce4-genmon-plugin
xfce4-mailwatch-plugin
xfce4-mount-plugin
xfce4-mpc-plugin
xfce4-netload-plugin
xfce4-notes-plugin
xfce4-notifyd
xfce4-panel
xfce4-places-plugin
xfce4-power-manager
xfce4-pulseaudio-plugin
xfce4-screensaver
xfce4-screenshooter
xfce4-sensors-plugin
xfce4-session
xfce4-settings
xfce4-smartbookmark-plugin
xfce4-systemload-plugin
xfce4-taskmanager
xfce4-terminal
xfce4-time-out-plugin
xfce4-timer-plugin
xfce4-verve-plugin
xfce4-wavelan-plugin
xfce4-weather-plugin
xfce4-whiskermenu-plugin
xfce4-xkb-plugin
xfconf
xfdesktop
xfwm4
xfwm4-themes
xfburn"

groups[video_gpu]=\
"vulkan-intel
vulkan-nouveau
vulkan-radeon
xf86-video-amdgpu
xf86-video-ati
xf86-video-nouveau"

groups[zsh_plugins]=\
"zsh
zsh-autocomplete
zsh-autosuggestions
zsh-completions
zsh-history-substring-search
zsh-lovers
zsh-syntax-highlighting"

groups[nemesis]=\
"awesome-terminal-fonts
sardi-icons
surfn-icons
plank"

### === [8] Install packages group by group ===

install_group() {
  local group_name="$1"
  echo -e "\n>>> Installing group: $group_name"
  local pkgs="${groups[$group_name]}"
  for pkg in $pkgs; do
    echo "→ Installing: $pkg"
    yay -S --noconfirm --needed "$pkg"
  done
}

for group in "${!groups[@]}"; do
  install_group "$group"
done

echo -e "\n✅ All package groups installed successfully. System setup is complete!"
