#!/usr/bin/env bash
set -e

if ! command -v gsettings >/dev/null 2>&1; then
  echo "gsettings not found. Please install dconf or gsettings."
  exit 1
fi

echo "Starting dbus-launch to run gsettings commands..."
eval $(dbus-launch)

echo "Setting Nemo default terminal to xfce4-terminal..."
gsettings set org.cinnamon.desktop.default-applications.terminal exec "xfce4-terminal"
gsettings set org.cinnamon.desktop.default-applications.terminal exec-arg "-e"

echo "Settings applied successfully."

# Kill the dbus session started by dbus-launch
kill "$DBUS_SESSION_BUS_PID"
unset DBUS_SESSION_BUS_PID
