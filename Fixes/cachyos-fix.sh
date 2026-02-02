#!/bin/bash
# CachyOS Emergency Boot Fix Script
# Usage: run as root from another Arch system

set -e

echo "🔹 Step 1: Mount CachyOS partitions"
ROOT_PART="/dev/nvme1n1p2"
BOOT_PART="/dev/nvme1n1p1"

sudo mount "$ROOT_PART" /mnt
sudo mount "$BOOT_PART" /mnt/boot

echo "🔹 Step 2: Mount virtual filesystems"
sudo mount --rbind /dev /mnt/dev
sudo mount --rbind /sys /mnt/sys
sudo mount --rbind /proc /mnt/proc
sudo mount --rbind /run /mnt/run

sudo mkdir -p /mnt/dev/pts
sudo mount -t devpts devpts /mnt/dev/pts -o gid=5,mode=620

echo "🔹 Step 3: Chroot into CachyOS"
sudo chroot /mnt /bin/bash <<'EOL'

echo "🔹 Step 4: Update package database and install kernels"
pacman -Sy --noconfirm linux-cachyos linux-cachyos-headers linux-cachyos-lts linux-cachyos-lts-headers

echo "🔹 Step 5: Rebuild initramfs for all kernels"
mkinitcpio -P

echo "🔹 Step 6: Regenerate GRUB configuration"
grub-mkconfig -o /boot/grub/grub.cfg

echo "✅ CachyOS Emergency Boot Fix complete inside chroot"

EOL

echo "🔹 Step 7: Unmount partitions"
sudo umount -R /mnt

echo "✅ All done! You can now reboot into CachyOS."
