#!/bin/bash

# Transmission ports
TRANS_PORT=51413
TRANS_WEBUI_PORT=9091

# Plex ports
PLEX_MAIN_PORT=32400
PLEX_DLNA_PORT=1900
PLEX_GDM_PORT1=32410
PLEX_GDM_PORT2=32412
PLEX_GDM_PORT3=32413
PLEX_GDM_PORT4=32414

# SSH port
SSH_PORT=22

echo "---------------------------"
echo " UFW Setup for SSH, Transmission, and Plex"
echo "---------------------------"

# Check if UFW is installed, install if not
if ! command -v ufw &> /dev/null; then
    echo "[!] UFW not found. Installing UFW..."
    sudo apt update && sudo apt install -y ufw

    if [ $? -ne 0 ]; then
        echo "[✗] Failed to install UFW. Exiting."
        exit 1
    fi
else
    echo "[✓] UFW is already installed."
fi

# Set default UFW policies
echo "[+] Setting default UFW policies..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Explicitly allow all outgoing traffic
echo "[+] Explicitly allowing all outgoing traffic..."
sudo ufw allow out from any to any

# Allow SSH
echo "[+] Allowing SSH on port ${SSH_PORT}..."
sudo ufw allow ${SSH_PORT}/tcp

# Allow Transmission ports
echo "[+] Allowing Transmission ports..."
sudo ufw allow ${TRANS_PORT}/tcp
sudo ufw allow ${TRANS_PORT}/udp
sudo ufw allow ${TRANS_WEBUI_PORT}/tcp

# Allow Plex Media Server ports
echo "[+] Allowing Plex Media Server ports..."
sudo ufw allow ${PLEX_MAIN_PORT}/tcp       # Web/app streaming
sudo ufw allow ${PLEX_DLNA_PORT}/udp       # DLNA
sudo ufw allow ${PLEX_GDM_PORT1}/udp       # Plex GDM
sudo ufw allow ${PLEX_GDM_PORT2}/udp
sudo ufw allow ${PLEX_GDM_PORT3}/udp
sudo ufw allow ${PLEX_GDM_PORT4}/udp

# Enable UFW (force without prompt)
echo "[+] Enabling UFW..."
sudo ufw --force enable

# Reload UFW to apply all rules
echo "[+] Reloading UFW to apply changes..."
sudo ufw reload

# Show status
echo "[+] UFW status:"
sudo ufw status verbose
