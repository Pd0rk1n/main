#!/bin/bash
# clone-arch.sh — clone Arch to a new drive using rsync
# WARNING: Assumes new partitions are already created and formatted!

set -euo pipefail

### Adjust these to match your setup
EFI_PART="/dev/sdb1"
ROOT_PART="/dev/sdb2"
MNT="/mnt/clone"

echo "==> Mounting new root partition..."
mkdir -p "$MNT"
mount "$ROOT_PART" "$MNT"

echo "==> Mounting EFI partition..."
mkdir -p "$MNT/boot/efi"
mount "$EFI_PART" "$MNT/boot/efi"

echo "==> Starting rsync copy..."
rsync -aAXHv \
  --exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found"} \
  / "$MNT"

echo "==> Chrooting into the new system..."
arch-chroot "$MNT" /bin/bash <<'EOT'
echo "==> Inside chroot: Generating fstab..."
genfstab -U / > /etc/fstab

# Choose either systemd-boot OR grub below:

# --- Systemd-boot ---
# echo "==> Installing systemd-boot..."
# bootctl install

# --- GRUB ---
echo "==> Installing GRUB bootloader..."
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg

EOT

echo "==> Unmounting cloned system..."
umount -R "$MNT"

echo "✅ Clone complete. Reboot and select the new drive in UEFI boot menu."
