#!/bin/bash

# Step 1: List current UFW rules
echo "Current UFW rules:"
sudo ufw status numbered

# Step 2: Prompt to delete any rule allowing 5353 from self (optional)
echo
read -p "Do you want to delete any incorrect '5353/udp from self' rule? (y/n): " choice
if [[ "$choice" == "y" ]]; then
    sudo ufw status numbered | grep 5353 | nl
    echo
    read -p "Enter the rule number to delete (or press Enter to skip): " rule_num
    if [[ "$rule_num" =~ ^[0-9]+$ ]]; then
        sudo ufw delete "$rule_num"
    fi
fi

# Step 3: Add correct rule for LAN mDNS
# Replace 10.0.0.0/24 with your actual subnet if different
echo "Adding correct mDNS rule for your LAN..."
sudo ufw allow from 10.0.0.0/24 to any port 5353 proto udp

# Step 4: Show final rules
echo
echo "Updated UFW rules:"
sudo ufw status verbose
