sudo tee /usr/local/bin/remove-nvidia-fw.sh > /dev/null << 'EOF'
#!/bin/bash
rm -rf /usr/lib/firmware/nvidia
EOF
