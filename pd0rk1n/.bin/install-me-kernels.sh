#!/bin/bash

# Define kernel options
kernels=(
  linux-cachyos "" off
  linux-cachyos-headers "" off
  linux-cachyos-lts "" off
  linux-cachyos-lts-headers "" off
  linux-clear "" off
  linux-clear-headers "" off
  linux-lqx "" off
  linux-lqx-headers "" off
  linux-lts515 "" off
  linux-lts515-headers "" off
  linux-lts61 "" off
  linux-lts61-headers "" off
  linux-lts66 "" off
  linux-lts66-headers "" off
  linux-mainline "" off
  linux-mainline-headers "" off
  linux-mainline-x64v3 "" off
  linux-mainline-x64v3-headers "" off
  linux-nitrous "" off
  linux-nitrous-headers "" off
  linux-vfio "" off
  linux-vfio-headers "" off
  linux-vfio-lts "" off
  linux-vfio-lts-headers "" off
  linux-vfio-x64v3 "" off
  linux-vfio-x64v3-headers "" off
  linux-x64v2 "" off
  linux-x64v2-headers "" off
  linux-x64v3 "" off
  linux-x64v3-headers "" off
  linux-x64v4 "" off
  linux-x64v4-headers "" off
  linux-xanmod-edge-x64v3 "" off
  linux-xanmod-edge-x64v3-headers "" off
  linux-xanmod-lts "" off
  linux-xanmod-lts-headers "" off
  linux-xanmod-rt "" off
  linux-xanmod-rt-headers "" off
  linux-xanmod-x64v2 "" off
  linux-xanmod-x64v2-headers "" off
  linux-znver2 "" off
  linux-znver2-headers "" off
  linux-znver3 "" off
  linux-znver3-headers "" off
  linux-znver4 "" off
  linux-znver4-headers "" off
  linux-znver5 "" off
  linux-znver5-headers "" off
)

# Use dialog to get user selections
selected=$(dialog --clear \
  --title "Select Kernel(s)" \
  --checklist "Choose kernel(s) to install:" 25 70 20 \
  "${kernels[@]}" \
  3>&1 1>&2 2>&3)

# Clear screen after dialog
clear

# If nothing selected, exit
if [[ -z "$selected" ]]; then
  echo "No kernels selected. Exiting."
  exit 1
fi

# Install selected packages
echo "Installing selected kernels: $selected"
sudo pacman -S --needed $selected
