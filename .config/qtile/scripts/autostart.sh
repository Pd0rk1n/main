#!/bin/bash
# =============================================================================
# autostart.sh — qtile session startup script
#
# Called BY qtile from the startup hook in config.py (not by the display
# manager directly), so it has NO window-manager loop — it just starts the
# background services and exits. qtile manages its own bar.
#
# To autostart your own apps, add:  run "your-app"
# To stop an autostart entry, comment it out with #
# =============================================================================

# run() — start a program only if it is not already running.
# Exact-match (-x) on the 15-char process comm name avoids false "already up"
# hits from loose substring matching.
run() {
  if ! pgrep -x "$(basename "$1" | head -c 15)" >/dev/null; then
    "$@" &
  fi
}

# ── Monitor layout ────────────────────────────────────────────────────────────
# Apply a saved arandr/xrandr screen layout named after the current user.
# Generate your layout with arandr, save it to ~/.screenlayout/<username>.sh
# Uncomment the xrandr line below if you are running inside VirtualBox.
#run xrandr --output Virtual-1 --primary --mode 1920x1080 --pos 0x0 --rotate normal
# Or set a native VirtualBox resolution that xrandr doesn't list (see the script):
#run $HOME/.config/qtile/scripts/set-screen-resolution-in-virtualbox.sh
# screen layout generated with arandr
[ -f "$HOME/.screenlayout/$(whoami).sh" ] && sh "$HOME/.screenlayout/$(whoami).sh"

# ── System tray applets ───────────────────────────────────────────────────────
run nm-applet                                        # NetworkManager wifi/eth tray
run pamac-tray                                       # Arch package manager tray
run variety                                          # Wallpaper rotator
run xfce4-power-manager                              # Battery / display power management
run blueberry-tray                                   # Bluetooth manager tray
run /usr/lib/xfce4/notifyd/xfce4-notifyd             # Desktop notification daemon
run /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1  # Polkit auth popups (sudo GUI)

# ── Compositor ────────────────────────────────────────────────────────────────
# picom by default — NOT fastcompmgr. fastcompmgr is faster/lighter but breaks
# fullscreen for some apps (VLC stays tiled, Sublime misbehaves); picom honours
# their fullscreen requests correctly. Toggle at runtime: super+p picom,
# super+g fastcompmgr. Only one compositor should run at a time.
run picom --config "$HOME/.config/qtile/scripts/picom.conf"

# ── Keyboard ──────────────────────────────────────────────────────────────────
run numlockx on                                      # Enable numlock on login
# sxhkd handles keybindings, replacing qtile's native bindings.
# Edit ~/.config/qtile/sxhkd/sxhkdrc to add or change keybindings.
run sxhkd -c ~/.config/qtile/sxhkd/sxhkdrc

# ── Volume control ────────────────────────────────────────────────────────────
run volctl                                           # PipeWire/PulseAudio volume tray

# ── Wallpaper ─────────────────────────────────────────────────────────────────
# Restore the last wallpaper set by feh (saved to ~/.fehbg automatically).
# Falls back to the default Kiro wallpaper if no history exists yet.
if [ -f "$HOME/.fehbg" ]; then
    sh "$HOME/.fehbg" &
else
    feh --bg-fill /usr/share/backgrounds/kiro/kiro-wallpaper.jpg &
fi
