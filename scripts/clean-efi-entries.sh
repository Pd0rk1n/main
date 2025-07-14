#!/bin/bash
set -e

# Change this to the boot number you want to KEEP (4 hex digits, e.g. 0001)
SAFE_BOOT_NUM="0001"

echo "⚠️  This script will delete all EFI boot entries except Boot$SAFE_BOOT_NUM"
echo "Running efibootmgr to list all current entries..."
sudo efibootmgr

read -p "Are you sure you want to proceed? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "Aborted."
  exit 1
fi

# Get all boot numbers except the safe one
entries=$(sudo efibootmgr | grep -oP '^Boot\K[0-9A-Fa-f]{4}' | grep -v -i "^$SAFE_BOOT_NUM$")

if [ -z "$entries" ]; then
  echo "No other EFI boot entries to remove."
  exit 0
fi

echo "Entries to remove: $entries"

for entry in $entries; do
  echo "Removing Boot$entry ..."
  sudo efibootmgr -b "$entry" -B
done

echo "Done. Kept Boot$SAFE_BOOT_NUM."
