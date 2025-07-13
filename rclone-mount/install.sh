#!/bin/bash

set -euo pipefail

SERVICE_NAME="rclone-gdrive.service"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_SRC="$(pwd)/$SERVICE_NAME"
MOUNT_DIR="$HOME/gdrive"

echo "Checking dependencies..."

for cmd in rclone fusermount loginctl systemctl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is not installed. Please install it and try again."
    exit 1
  fi
done

echo "Creating mount directory at $MOUNT_DIR (if it doesn't exist)..."
mkdir -p "$MOUNT_DIR"

echo "Creating systemd user directory at $SYSTEMD_USER_DIR (if it doesn't exist)..."
mkdir -p "$SYSTEMD_USER_DIR"

echo "Copying systemd service file..."
cp "$SERVICE_SRC" "$SYSTEMD_USER_DIR/"

echo "Enabling linger for user $USER (to allow service to run after reboot)..."
loginctl enable-linger "$USER"

echo "Reloading systemd user daemon..."
systemctl --user daemon-reload

echo "Enabling $SERVICE_NAME to start at boot..."
systemctl --user enable "$SERVICE_NAME"

echo "Starting $SERVICE_NAME now..."
systemctl --user restart "$SERVICE_NAME"

echo "Done! Your Google Drive will be mounted to $MOUNT_DIR now and on every reboot."
