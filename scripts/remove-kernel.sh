#!/bin/bash
set -e

# Get list of installed kernels (packages starting with linux)
installed_kernels=($(pacman -Qq | grep '^linux'))

if [ ${#installed_kernels[@]} -eq 0 ]; then
  echo "No installed linux kernels found."
  exit 0
fi

echo "Select a kernel to remove:"
select kernel in "${installed_kernels[@]}" "Quit"; do
  if [[ "$kernel" == "Quit" ]]; then
    echo "Exiting."
    exit 0
  elif [[ -n "$kernel" ]]; then
    echo "You selected: $kernel"
    break
  fi
done

# Confirm removal
read -rp "Are you sure you want to remove $kernel and its headers? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborting."
  exit 0
fi

headers="${kernel}-headers"

echo "Removing $kernel and $headers..."
sudo pacman -Rns --noconfirm "$kernel" "$headers"

# Detect bootloader
if [[ -d /boot/loader/entries ]]; then
  bootloader="systemd-boot"
elif [[ -f /boot/grub/grub.cfg ]]; then
  bootloader="grub"
else
  echo "No supported bootloader found, skipping bootloader update."
  exit 0
fi

echo "Bootloader detected: $bootloader"

if [[ "$bootloader" == "systemd-boot" ]]; then
  entry_file="/boot/loader/entries/arch-${kernel}.conf"
  if [ -f "$entry_file" ]; then
    echo "Removing systemd-boot entry $entry_file"
    sudo rm -f "$entry_file"
  else
    echo "No systemd-boot entry found for $kernel"
  fi

  # Optionally reset default if it pointed to the removed kernel
  default_entry=$(grep '^default ' /boot/loader/loader.conf | cut -d' ' -f2)
  if [[ "$default_entry" == "arch-${kernel}.conf" ]]; then
    echo "Resetting default bootloader entry..."
    sudo sed -i '/^default/d' /boot/loader/loader.conf
    # You can set a new default here if you want
  fi

elif [[ "$bootloader" == "grub" ]]; then
  echo "Updating GRUB config..."
  sudo grub-mkconfig -o /boot/grub/grub.cfg
fi

echo "Kernel $kernel removed and bootloader updated."
